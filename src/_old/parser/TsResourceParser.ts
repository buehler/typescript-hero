import {
    ClassDeclaration as TshClassDeclaration,
    ConstructorDeclaration as TshConstructorDeclaration,
    DefaultDeclaration,
    EnumDeclaration as TshEnumDeclaration,
    FunctionDeclaration as TshFunctionDeclaration,
    InterfaceDeclaration as TshInterfaceDeclaration,
    MethodDeclaration as TshMethodDeclaration,
    ParameterDeclaration as TshParameterDeclaration,
    PropertyDeclaration as TshPropertyDeclaration,
    DeclarationVisibility,
    TsExportableCallableDeclaration,
    TsTypedExportableCallableDeclaration,
    TypeAliasDeclaration as TshTypeAliasDeclaration,
    VariableDeclaration as TshVariableDeclaration
} from '../models/TsDeclaration';
import { TsAllFromExport, TsAssignedExport, TsNamedFromExport } from '../models/TsExport';
import {
    TsDefaultImport,
    TsExternalModuleImport,
    TsNamedImport,
    TsNamespaceImport,
    TsStringImport
} from '../models/TsImport';
import { TsResolveSpecifier } from '../models/TsResolveSpecifier';
import { TsFile, TsModule, TsNamespace, TsResource } from '../models/TsResource';
import { Logger, LoggerFactory } from '../utilities/Logger';
import {
    isArrayBindingPattern,
    isConstructorDeclaration,
    isExportDeclaration,
    isExternalModuleReference,
    isIdentifier,
    isImportDeclaration,
    isMethodDeclaration,
    isMethodSignature,
    isNamedExports,
    isNamedImports,
    isNamespaceImport,
    isObjectBindingPattern,
    isPropertyDeclaration,
    isPropertySignature,
    isStringLiteral
} from '../utilities/TypeGuards';
import { readFileSync } from 'fs';
import { inject, injectable } from 'inversify';
import {
    ArrayBindingPattern,
    BindingElement,
    ClassDeclaration,
    ConstructorDeclaration,
    createSourceFile,
    EnumDeclaration,
    ExportAssignment,
    ExportDeclaration,
    ExternalModuleReference,
    FunctionDeclaration,
    Identifier,
    ImportDeclaration,
    ImportEqualsDeclaration,
    InterfaceDeclaration,
    MethodDeclaration,
    MethodSignature,
    ModuleDeclaration,
    NamedImports,
    NamespaceImport,
    Node,
    TypeNode,
    NodeFlags,
    ModifierFlags,
    getCombinedModifierFlags,
    ObjectBindingPattern,
    ParameterDeclaration,
    ScriptTarget,
    SourceFile,
    StringLiteral,
    SyntaxKind,
    TypeAliasDeclaration,
    VariableStatement
} from 'typescript';
import { CancellationToken, Uri } from 'vscode';

const usageNotAllowedParents = [
    SyntaxKind.ImportEqualsDeclaration,
    SyntaxKind.ImportSpecifier,
    SyntaxKind.NamespaceImport,
    SyntaxKind.ClassDeclaration,
    SyntaxKind.ImportDeclaration,
    SyntaxKind.InterfaceDeclaration,
    SyntaxKind.ExportDeclaration,
    SyntaxKind.ExportSpecifier,
    SyntaxKind.ImportSpecifier,
    SyntaxKind.FunctionDeclaration,
    SyntaxKind.EnumDeclaration,
    SyntaxKind.TypeAliasDeclaration,
    SyntaxKind.MethodDeclaration
];

const usageAllowedIfLast = [
    SyntaxKind.Parameter,
    SyntaxKind.PropertyDeclaration,
    SyntaxKind.VariableDeclaration,
    SyntaxKind.ElementAccessExpression,
    SyntaxKind.BinaryExpression
];

const usagePredicates = [
    (o: Node) => usageNotAllowedParents.indexOf(o.parent.kind) === -1,
    allowedIfLastIdentifier,
    allowedIfPropertyAccessFirst
];

/**
 * Predicate function to determine if the node is possible as a "usage".
 * Checks for the node identifier to be the last of the identifier list.
 * 
 * @param {Node} node
 * @returns {boolean}
 */
function allowedIfLastIdentifier(node: Node): boolean {
    if (usageAllowedIfLast.indexOf(node.parent.kind) === -1) {
        return true;
    }

    let children = node.parent.getChildren().filter(o => o.kind === SyntaxKind.Identifier);
    return children.length === 1 || children.indexOf(node) === 1;
}

/**
 * Predicate function to determine if the node is possible as a "usage".
 * Checks if the identifier is on the lefthand side of a property access.
 * 
 * @param {Node} node
 * @returns {boolean}
 */
function allowedIfPropertyAccessFirst(node: Node): boolean {
    if (node.parent.kind !== SyntaxKind.PropertyAccessExpression) {
        return true;
    }

    let children = node.parent.getChildren();
    return children.indexOf(node) === 0;
}

/**
 * Function that calculates the default name of a resource.
 * This is used when a default export has no name (i.e. export class {}).
 * 
 * @param {TsResource} resource
 * @returns {string}
 */
function getDefaultResourceIdentifier(resource: TsResource): string {
    if (resource instanceof TsFile && resource.isWorkspaceFile) {
        return resource.parsedPath.name;
    }
    return resource.getIdentifier();
}

/**
 * Returns the type text (type information) for a given node.
 * 
 * @param {TypeNode} node
 * @returns {(string|undefined)}
 */
function getNodeType(node: TypeNode): string | undefined {
    return node ? node.getText() : undefined;
}

/**
 * Returns the enum value (visibility) of a node.
 * 
 * @param {Node} node
 * @returns
 */
function getNodeVisibility(node: Node): DeclarationVisibility | undefined {
    if (!node.modifiers) {
        return undefined;
    }

    for (let modifier of node.modifiers) {
        switch (modifier.kind) {
            case SyntaxKind.PublicKeyword:
                return DeclarationVisibility.Public;
            case SyntaxKind.ProtectedKeyword:
                return DeclarationVisibility.Protected;
            case SyntaxKind.PrivateKeyword:
                return DeclarationVisibility.Private;
            default:
                break;
        }
    }
}

/**
 * Magic.happen('here');
 * This class is the parser of the whole extension. It uses the typescript compiler to parse a file or given
 * source code into the token stream and therefore into the AST of the source. Afterwards an array of
 * resources is generated and returned.
 * 
 * @export
 * @class TsResourceParser
 */
export class TsResourceParser {

    /**
     * Parses an identifier into a usage of a resource if the predicates are true.
     * 
     * @private
     * @param {TsResource} tsResource
     * @param {Identifier} node
     * 
     * @memberOf TsResourceParser
     */
    private parseIdentifier(tsResource: TsResource, node: Identifier): void {
        if (node.parent && usagePredicates.every(predicate => predicate(node))) {
            if (tsResource.usages.indexOf(node.text) === -1) {
                tsResource.usages.push(node.text);
            }
        }
    }

    /**
     * Parses an enum node into the declaration.
     * 
     * @private
     * @param {TsResource} tsResource
     * @param {EnumDeclaration} node
     * 
     * @memberOf TsResourceParser
     */
    private parseEnum(tsResource: TsResource, node: EnumDeclaration): void {
        let declaration = new TshEnumDeclaration(
            node.name.text, node.getStart(), node.getEnd(), this.checkExported(node)
        );
        declaration.members = node.members.map(o => o.name.getText());
        tsResource.declarations.push(declaration);
    }

    /**
     * Parses a type alias into the declaration.
     * 
     * @private
     * @param {TsResource} tsResource
     * @param {TypeAliasDeclaration} node
     * 
     * @memberOf TsResourceParser
     */
    private parseTypeAlias(tsResource: TsResource, node: TypeAliasDeclaration): void {
        tsResource.declarations.push(
            new TshTypeAliasDeclaration(node.name.text, node.getStart(), node.getEnd(), this.checkExported(node))
        );
    }

    /**
     * Parses a function into its declaration.
     * Parses the functions sub information like parameters and variables.
     * 
     * @private
     * @param {TsResource} tsResource
     * @param {FunctionDeclaration} node
     * 
     * @memberOf TsResourceParser
     */
    private parseFunction(tsResource: TsResource, node: FunctionDeclaration): void {
        let name = node.name ? node.name.text : getDefaultResourceIdentifier(tsResource);
        let func = new TshFunctionDeclaration(
            name, getNodeType(node.type), node.getStart(), node.getEnd(), this.checkExported(node)
        );
        if (this.checkDefaultExport(node)) {
            func.isExported = false;
            tsResource.declarations.push(new DefaultDeclaration(func.name, tsResource));
        }
        func.parameters = this.parseMethodParams(node);
        tsResource.declarations.push(func);
        this.parseFunctionParts(tsResource, func, node);
    }

    /**
     * Parse a variable. Information such as "is the variable const" are calculated here.
     * 
     * @private
     * @param {(TsResource | TsExportableCallableDeclaration)} parent
     * @param {VariableStatement} node
     * 
     * @memberOf TsResourceParser
     */
    private parseVariable(
        parent: TsResource | TsExportableCallableDeclaration | TsTypedExportableCallableDeclaration,
        node: VariableStatement
    ): void {
        let isConst = node.declarationList.getChildren().some(o => o.kind === SyntaxKind.ConstKeyword);
        if (node.declarationList && node.declarationList.declarations) {
            node.declarationList.declarations.forEach(o => {
                let declaration = new TshVariableDeclaration(
                    o.name.getText(),
                    this.checkExported(node),
                    isConst,
                    getNodeType(o.type),
                    node.getStart(),
                    node.getEnd()
                );
                if (parent instanceof TsExportableCallableDeclaration ||
                    parent instanceof TsTypedExportableCallableDeclaration) {
                    parent.variables.push(declaration);
                } else {
                    parent.declarations.push(declaration);
                }
            });
        }
    }

    /**
     * Parses an interface node into its declaration.
     * Calculates the property and method defintions of the interface as well.
     * 
     * @private
     * @param {TsResource} tsResource
     * @param {InterfaceDeclaration} node
     * 
     * @memberOf TsResourceParser
     */
    private parseInterface(tsResource: TsResource, node: InterfaceDeclaration): void {
        let name = node.name ? node.name.text : getDefaultResourceIdentifier(tsResource);
        let interfaceDeclaration = new TshInterfaceDeclaration(
            name, node.getStart(), node.getEnd(), this.checkExported(node)
        );
        if (this.checkDefaultExport(node)) {
            interfaceDeclaration.isExported = false;
            tsResource.declarations.push(new DefaultDeclaration(interfaceDeclaration.name, tsResource));
        }
        if (node.members) {
            node.members.forEach(o => {
                if (isPropertySignature(o)) {
                    interfaceDeclaration.properties.push(
                        new TshPropertyDeclaration(
                            (o.name as Identifier).text,
                            DeclarationVisibility.Public,
                            getNodeType(o.type),
                            o.getStart(),
                            o.getEnd()
                        )
                    );
                } else if (isMethodSignature(o)) {
                    let method = new TshMethodDeclaration(
                        (o.name as Identifier).text,
                        getNodeType(o.type),
                        DeclarationVisibility.Public,
                        o.getStart(),
                        o.getEnd(),
                        true
                    );
                    method.parameters = this.parseMethodParams(o);
                    interfaceDeclaration.methods.push(method);
                }
            });
        }
        tsResource.declarations.push(interfaceDeclaration);
    }

    /**
     * Parses a class node into its declaration. Calculates the properties, constructors and methods of the class.
     * 
     * @private
     * @param {TsResource} tsResource
     * @param {ClassDeclaration} node
     * 
     * @memberOf TsResourceParser
     */
    private parseClass(tsResource: TsResource, node: ClassDeclaration): void {
        let name = node.name ? node.name.text : getDefaultResourceIdentifier(tsResource);
        let classDeclaration = new TshClassDeclaration(name, node.getStart(), node.getEnd(), this.checkExported(node));
        if (this.checkDefaultExport(node)) {
            classDeclaration.isExported = false;
            tsResource.declarations.push(new DefaultDeclaration(classDeclaration.name, tsResource));
        }
        if (node.members) {
            node.members.forEach(o => {
                if (isPropertyDeclaration(o)) {
                    let actualCount = classDeclaration.properties.length;
                    if (o.modifiers) {
                        classDeclaration.properties.push(
                            new TshPropertyDeclaration(
                                (o.name as Identifier).text,
                                getNodeVisibility(o),
                                getNodeType(o.type),
                                o.getStart(),
                                o.getEnd()
                            )
                        );
                    }
                    if (actualCount === classDeclaration.properties.length) {
                        classDeclaration.properties.push(
                            new TshPropertyDeclaration(
                                (o.name as Identifier).text,
                                getNodeVisibility(o),
                                getNodeType(o.type),
                                o.getStart(),
                                o.getEnd()
                            )
                        );
                    }
                    return;
                }

                if (isConstructorDeclaration(o)) {
                    let ctor = new TshConstructorDeclaration(o.getStart(), o.getEnd());
                    this.parseCtorParams(classDeclaration, ctor, o);
                    classDeclaration.ctor = ctor;
                    this.parseFunctionParts(tsResource, ctor, o);
                } else if (isMethodDeclaration(o)) {
                    let method = new TshMethodDeclaration(
                        (o.name as Identifier).text,
                        getNodeType(o.type),
                        getNodeVisibility(o),
                        o.getStart(),
                        o.getEnd(),
                        o.modifiers && o.modifiers.some(m => m.kind === SyntaxKind.AbstractKeyword)
                    );
                    method.parameters = this.parseMethodParams(o);
                    classDeclaration.methods.push(method);
                    this.parseFunctionParts(tsResource, method, o);
                }
            });
        }

        this.parseClassIdentifiers(tsResource, node);

        tsResource.declarations.push(classDeclaration);
    }

    /**
     * Parses the identifiers of a class (usages).
     * 
     * @private
     * @param {TsResource} tsResource
     * @param {Node} node
     * 
     * @memberOf TsResourceParser
     */
    private parseClassIdentifiers(tsResource: TsResource, node: Node): void {
        for (let child of node.getChildren()) {
            switch (child.kind) {
                case SyntaxKind.Identifier:
                    this.parseIdentifier(tsResource, <Identifier>child);
                    break;
                default:
                    break;
            }
            this.parseClassIdentifiers(tsResource, child);
        }
    }

    /**
     * Parse a module to its declaration. Create a new namespace or module declaration and return it to
     * be used as the new "container".
     * 
     * @private
     * @param {TsResource} tsResource
     * @param {ModuleDeclaration} node
     * @returns {TsResource}
     * 
     * @memberOf TsResourceParser
     */
    private parseModule(tsResource: TsResource, node: ModuleDeclaration): TsResource {
        let resource = (node.flags & NodeFlags.Namespace) === NodeFlags.Namespace ?
            new TsNamespace((node.name as Identifier).text, node.getStart(), node.getEnd()) :
            new TsModule((node.name as Identifier).text, node.getStart(), node.getEnd());
        tsResource.resources.push(resource);
        return resource;
    }

    /**
     * Parse the parts of a function. All functions / methods contain various information about used variables
     * and parameters.
     * 
     * @private
     * @param {TsResource} tsResource
     * @param {(TshConstructorDeclaration | TshMethodDeclaration | TshFunctionDeclaration)} parent
     * @param {Node} node
     * 
     * @memberOf TsResourceParser
     */
    private parseFunctionParts(
        tsResource: TsResource,
        parent: TshConstructorDeclaration | TshMethodDeclaration | TshFunctionDeclaration,
        node: Node
    ): void {
        for (let child of node.getChildren()) {
            switch (child.kind) {
                case SyntaxKind.Identifier:
                    this.parseIdentifier(tsResource, <Identifier>child);
                    break;
                case SyntaxKind.VariableStatement:
                    this.parseVariable(parent, <VariableStatement>child);
                    break;
                default:
                    break;
            }
            this.parseFunctionParts(tsResource, parent, child);
        }
    }

    /**
     * Parse information about a constructor. Contains parameters and used modifiers
     * (i.e. constructor(private name: string)).
     * 
     * @private
     * @param {TshClassDeclaration} parent
     * @param {TshConstructorDeclaration} ctor
     * @param {ConstructorDeclaration} node
     * @returns {void}
     * 
     * @memberOf TsResourceParser
     */
    private parseCtorParams(
        parent: TshClassDeclaration,
        ctor: TshConstructorDeclaration,
        node: ConstructorDeclaration
    ): void {
        if (!node.parameters) {
            return;
        }
        node.parameters.forEach(o => {
            if (isIdentifier(o.name)) {
                ctor.parameters.push(
                    new TshParameterDeclaration(
                        (o.name as Identifier).text, getNodeType(o.type), o.getStart(), o.getEnd()
                    )
                );
                if (!o.modifiers) {
                    return;
                }
                parent.properties.push(
                    new TshPropertyDeclaration(
                        (o.name as Identifier).text,
                        getNodeVisibility(o),
                        getNodeType(o.type),
                        o.getStart(),
                        o.getEnd()
                    )
                );
            } else if (isObjectBindingPattern(o.name) || isArrayBindingPattern(o.name)) {
                let identifiers = o.name as ObjectBindingPattern | ArrayBindingPattern,
                    elements = [...identifiers.elements];
                ctor.parameters = ctor.parameters.concat(elements.map((bind: BindingElement) => {
                    if (isIdentifier(bind.name)) {
                        return new TshParameterDeclaration(
                            (bind.name as Identifier).text, undefined, bind.getStart(), bind.getEnd()
                        );
                    }
                }).filter(Boolean));
            }
        });
    }

    /**
     * Parse method parameters. 
     * 
     * @private
     * @param {(FunctionDeclaration | MethodDeclaration | MethodSignature)} node
     * @returns {TshParameterDeclaration[]}
     * 
     * @memberOf TsResourceParser
     */
    private parseMethodParams(
        node: FunctionDeclaration | MethodDeclaration | MethodSignature
    ): TshParameterDeclaration[] {
        return node.parameters.reduce((all: TshParameterDeclaration[], cur: ParameterDeclaration) => {
            if (isIdentifier(cur.name)) {
                all.push(new TshParameterDeclaration(
                    (cur.name as Identifier).text, getNodeType(cur.type), cur.getStart(), cur.getEnd()
                ));
            } else if (isObjectBindingPattern(cur.name) || isArrayBindingPattern(cur.name)) {
                let identifiers = cur.name as ObjectBindingPattern | ArrayBindingPattern,
                    elements = [...identifiers.elements];
                all = all.concat(elements.map((o: BindingElement) => {
                    if (isIdentifier(o.name)) {
                        return new TshParameterDeclaration(
                            (o.name as Identifier).text, undefined, o.getStart(), o.getEnd()
                        );
                    }
                }).filter(Boolean));
            }
            return all;
        }, []);
    }

    /**
     * Check if the given typescript node has the exported flag.
     * (e.g. export class Foobar).
     * 
     * @private
     * @param {Node} node
     * @returns {boolean}
     * 
     * @memberOf TsResourceParser
     */
    private checkExported(node: Node): boolean {
        let flags = getCombinedModifierFlags(node);
        return (flags & ModifierFlags.Export) === ModifierFlags.Export;
    }

    /**
     * Check if the given typescript node has the default flag.
     * (e.g. export default class Foobar).
     * 
     * @private
     * @param {Node} node
     * @returns {boolean}
     * 
     * @memberOf TsResourceParser
     */
    private checkDefaultExport(node: Node): boolean {
        let flags = getCombinedModifierFlags(node);
        return (flags & ModifierFlags.Default) === ModifierFlags.Default;
    }

}
