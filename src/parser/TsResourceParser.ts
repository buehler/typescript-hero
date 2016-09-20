import {CancellationRequested} from '../models/CancellationRequested';
import {TsAllFromExport, TsAssignedExport, TsNamedFromExport} from '../models/TsExport';
import {TsDefaultImport, TsExternalModuleImport, TsNamedImport, TsNamespaceImport, TsStringImport} from '../models/TsImport';
import {TsResolveSpecifier} from '../models/TsResolveSpecifier';
import {TsFile, TsModule, TsNamespace, TsResource} from '../models/TsResource';
import {Logger, LoggerFactory} from '../utilities/Logger';
import {isArrayBindingPattern, isConstructorDeclaration, isExportDeclaration, isExternalModuleReference, isIdentifier, isImportDeclaration, isMethodDeclaration, isMethodSignature, isNamedExports, isNamedImports, isNamespaceImport, isObjectBindingPattern, isPropertyDeclaration, isPropertySignature, isStringLiteral} from '../utilities/TypeGuards';
import {readFileSync} from 'fs';
import {inject, injectable} from 'inversify';
import {ArrayBindingPattern, BindingElement, ClassDeclaration, ConstructorDeclaration, createSourceFile, EnumDeclaration, ExportAssignment, ExportDeclaration, ExternalModuleReference, FunctionDeclaration, Identifier, ImportDeclaration, ImportEqualsDeclaration, InterfaceDeclaration, MethodDeclaration, MethodSignature, ModuleDeclaration, NamedImports, NamespaceImport, Node, NodeFlags, ObjectBindingPattern, ParameterDeclaration, ScriptTarget, SourceFile, StringLiteral, SyntaxKind, TypeAliasDeclaration, VariableStatement} from 'typescript';
import {ClassDeclaration as TshClassDeclaration, ConstructorDeclaration as TshConstructorDeclaration, DefaultDeclaration, EnumDeclaration as TshEnumDeclaration, FunctionDeclaration as TshFunctionDeclaration, InterfaceDeclaration as TshInterfaceDeclaration, MethodDeclaration as TshMethodDeclaration, ParameterDeclaration as TshParameterDeclaration, PropertyDeclaration as TshPropertyDeclaration, PropertyVisibility, TsExportableCallableDeclaration, TypeAliasDeclaration as TshTypeAliasDeclaration, VariableDeclaration as TshVariableDeclaration} from '../models/TsDeclaration';
import {CancellationToken, Uri} from 'vscode';


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

function allowedIfLastIdentifier(node: Node): boolean {
    if (usageAllowedIfLast.indexOf(node.parent.kind) === -1) {
        return true;
    }

    let children = node.parent.getChildren().filter(o => o.kind === SyntaxKind.Identifier);
    return children.length === 1 || children.indexOf(node) === 1;
}

function allowedIfPropertyAccessFirst(node: Node): boolean {
    if (node.parent.kind !== SyntaxKind.PropertyAccessExpression) {
        return true;
    }

    let children = node.parent.getChildren();
    return children.indexOf(node) === 0;
}

@injectable()
export class TsResourceParser {
    private logger: Logger;

    constructor( @inject('LoggerFactory') loggerFactory: LoggerFactory) {
        this.logger = loggerFactory('TsResourceParser');
        this.logger.info('Instantiated.');
    }

    public parseSource(source: string): Promise<TsFile> {
        return new Promise((resolve, reject) => {
            try {
                let tmp = createSourceFile('inline.ts', source, ScriptTarget.ES6, true);
                resolve(this.parseTypescript(tmp));
            } catch (e) {
                this.logger.error('Error happend during source parsing', { error: e });
                reject(e);
            }
        });
    }

    public parseFile(file: Uri): Promise<TsFile> {
        return this.parseFiles([file]).then(files => files[0]);
    }

    public parseFiles(filePathes: Uri[], cancellationToken?: CancellationToken): Promise<TsFile[]> {
        return new Promise((resolve, reject) => {
            try {
                if (cancellationToken && cancellationToken.onCancellationRequested) {
                    throw new CancellationRequested();
                }
                let parsed = filePathes
                    .map(o => createSourceFile(o.fsPath, readFileSync(o.fsPath).toString(), ScriptTarget.ES6, true))
                    .map(o => this.parseTypescript(o, cancellationToken));
                if (cancellationToken && cancellationToken.onCancellationRequested) {
                    throw new CancellationRequested();
                }
                resolve(parsed);
            } catch (e) {
                if (!(e instanceof CancellationRequested)) {
                    this.logger.error('Error happend during file parsing', { error: e });
                }
                reject(e);
            }
        });
    }

    private parseTypescript(source: SourceFile, cancellationToken?: CancellationToken): TsFile {
        let tsFile = new TsFile(source.fileName);

        let syntaxList = source.getChildAt(0);
        if (cancellationToken && cancellationToken.onCancellationRequested) {
            throw new CancellationRequested();
        }
        this.parse(tsFile, syntaxList, cancellationToken);

        return tsFile;
    }

    private parse(tsResource: TsResource, node: Node, cancellationToken?: CancellationToken): void {
        for (let child of node.getChildren()) {
            if (cancellationToken && cancellationToken.onCancellationRequested) {
                throw new CancellationRequested();
            }
            switch (child.kind) {
                case SyntaxKind.ImportDeclaration:
                case SyntaxKind.ImportEqualsDeclaration:
                    this.parseImport(tsResource, <ImportDeclaration | ImportEqualsDeclaration>child);
                    break;
                case SyntaxKind.ExportDeclaration:
                case SyntaxKind.ExportAssignment:
                    this.parseExport(tsResource, <ExportAssignment | ExportDeclaration>child);
                    break;
                case SyntaxKind.EnumDeclaration:
                    this.parseEnum(tsResource, <EnumDeclaration>child);
                    break;
                case SyntaxKind.TypeAliasDeclaration:
                    this.parseTypeAlias(tsResource, <TypeAliasDeclaration>child);
                    break;
                case SyntaxKind.FunctionDeclaration:
                    this.parseFunction(tsResource, <FunctionDeclaration>child);
                    continue;
                case SyntaxKind.VariableStatement:
                    this.parseVariable(tsResource, <VariableStatement>child);
                    break;
                case SyntaxKind.InterfaceDeclaration:
                    this.parseInterface(tsResource, <InterfaceDeclaration>child);
                    break;
                case SyntaxKind.ClassDeclaration:
                    this.parseClass(tsResource, <ClassDeclaration>child);
                    continue;
                case SyntaxKind.Identifier:
                    this.parseIdentifier(tsResource, <Identifier>child);
                    break;
                case SyntaxKind.ModuleDeclaration:
                    let resource = this.parseModule(tsResource, <ModuleDeclaration>child);
                    this.parse(resource, child, cancellationToken);
                    continue;
            }
            this.parse(tsResource, child, cancellationToken);
        }
    }

    private parseImport(tsResource: TsResource, node: ImportDeclaration | ImportEqualsDeclaration): void {
        if (isImportDeclaration(node)) {
            if (node.importClause && isNamespaceImport(node.importClause.namedBindings)) {
                let lib = node.moduleSpecifier as StringLiteral,
                    alias = (node.importClause.namedBindings as NamespaceImport).name as Identifier;
                tsResource.imports.push(new TsNamespaceImport(lib.text, alias.text));
            } else if (node.importClause && isNamedImports(node.importClause.namedBindings)) {
                let lib = node.moduleSpecifier as StringLiteral,
                    bindings = node.importClause.namedBindings as NamedImports,
                    tsImport = new TsNamedImport(lib.text);
                tsImport.specifiers = bindings.elements.map(o => o.propertyName && o.name ? new TsResolveSpecifier(o.propertyName.text, o.name.text) : new TsResolveSpecifier(o.name.text));

                tsResource.imports.push(tsImport);
            } else if (node.importClause && node.importClause.name) {
                let lib = node.moduleSpecifier as StringLiteral,
                    alias = node.importClause.name;
                tsResource.imports.push(new TsDefaultImport(lib.text, alias.text));
            } else if (node.moduleSpecifier && isStringLiteral(node.moduleSpecifier)) {
                let lib = node.moduleSpecifier as StringLiteral;
                tsResource.imports.push(new TsStringImport(lib.text));
            }
        } else if (isExternalModuleReference(node.moduleReference)) {
            let alias = node.name,
                lib = (node.moduleReference as ExternalModuleReference).expression as Identifier;
            tsResource.imports.push(new TsExternalModuleImport(lib.text, alias.text));
        }
    }

    private parseExport(tsResource: TsResource, node: ExportDeclaration | ExportAssignment): void {
        if (isExportDeclaration(node)) {
            let tsExport = node as ExportDeclaration;
            if (!isStringLiteral(tsExport.moduleSpecifier)) {
                return;
            }
            if (tsExport.getText().indexOf('*') > -1) {
                tsResource.exports.push(new TsAllFromExport((tsExport.moduleSpecifier as StringLiteral).text));
            } else if (tsExport.exportClause && isNamedExports(tsExport.exportClause)) {
                let lib = tsExport.moduleSpecifier as StringLiteral,
                    ex = new TsNamedFromExport(lib.text);
                ex.specifiers = tsExport.exportClause.elements.map(o => o.propertyName && o.name ? new TsResolveSpecifier(o.propertyName.text, o.name.text) : new TsResolveSpecifier(o.name.text));

                tsResource.exports.push(ex);
            }
        } else {
            let literal = node.expression as Identifier;
            if (node.isExportEquals) {
                tsResource.exports.push(new TsAssignedExport(literal.text, tsResource));
            } else {
                tsResource.declarations.push(new DefaultDeclaration(literal.text, tsResource));
            }
        }
    }

    private parseIdentifier(tsResource: TsResource, node: Identifier): void {
        if (node.parent && usagePredicates.every(predicate => predicate(node))) {
            if (tsResource.usages.indexOf(node.text) === -1) {
                tsResource.usages.push(node.text);
            }
        }
    }

    private parseEnum(tsResource: TsResource, node: EnumDeclaration): void {
        let declaration = new TshEnumDeclaration(node.name.text, this.checkExported(node));
        declaration.members = node.members.map(o => o.name.getText());
        tsResource.declarations.push(declaration);
    }

    private parseTypeAlias(tsResource: TsResource, node: TypeAliasDeclaration): void {
        tsResource.declarations.push(new TshTypeAliasDeclaration(node.name.text, this.checkExported(node)));
    }

    private parseFunction(tsResource: TsResource, node: FunctionDeclaration): void {
        let func = new TshFunctionDeclaration(node.name.text, this.checkExported(node));
        func.parameters = this.parseMethodParams(node);
        tsResource.declarations.push(func);
        this.parseFunctionParts(tsResource, func, node);
    }

    private parseVariable(parent: TsResource | TsExportableCallableDeclaration, node: VariableStatement): void {
        let isConst = node.declarationList.getChildren().some(o => o.kind === SyntaxKind.ConstKeyword);
        if (node.declarationList && node.declarationList.declarations) {
            node.declarationList.declarations.forEach(o => {
                let declaration = new TshVariableDeclaration(o.name.getText(), this.checkExported(node), isConst);
                if (parent instanceof TsExportableCallableDeclaration) {
                    parent.variables.push(declaration);
                } else {
                    parent.declarations.push(declaration);
                }
            });
        }
    }

    private parseInterface(tsResource: TsResource, node: InterfaceDeclaration): void {
        let interfaceDeclaration = new TshInterfaceDeclaration(node.name.text, this.checkExported(node));
        if (node.members) {
            node.members.forEach(o => {
                if (isPropertySignature(o)) {
                    interfaceDeclaration.properties.push(new TshPropertyDeclaration((o.name as Identifier).text, PropertyVisibility.Public));
                } else if (isMethodSignature(o)) {
                    let method = new TshMethodDeclaration((o.name as Identifier).text);
                    method.parameters = this.parseMethodParams(o);
                    interfaceDeclaration.methods.push(method);
                }
            });
        }
        tsResource.declarations.push(interfaceDeclaration);
    }

    private parseClass(tsResource: TsResource, node: ClassDeclaration): void {
        let classDeclaration = new TshClassDeclaration(node.name.text, this.checkExported(node));
        if (node.members) {
            node.members.forEach(o => {
                if (isPropertyDeclaration(o)) {
                    let actualCount = classDeclaration.properties.length;
                    if (o.modifiers) {
                        o.modifiers.forEach(m => {
                            if (m.kind === SyntaxKind.PublicKeyword) {
                                classDeclaration.properties.push(new TshPropertyDeclaration((o.name as Identifier).text, PropertyVisibility.Public));
                                return;
                            }
                            if (m.kind === SyntaxKind.ProtectedKeyword) {
                                classDeclaration.properties.push(new TshPropertyDeclaration((o.name as Identifier).text, PropertyVisibility.Protected));
                                return;
                            }
                            if (m.kind === SyntaxKind.PrivateKeyword) {
                                classDeclaration.properties.push(new TshPropertyDeclaration((o.name as Identifier).text, PropertyVisibility.Private));
                                return;
                            }
                        });
                    }
                    if (actualCount === classDeclaration.properties.length) {
                        classDeclaration.properties.push(new TshPropertyDeclaration((o.name as Identifier).text, PropertyVisibility.Public));
                    }
                    return;
                }

                if (isConstructorDeclaration(o)) {
                    let ctor = new TshConstructorDeclaration();
                    this.parseCtorParams(classDeclaration, ctor, o);
                    classDeclaration.ctor = ctor;
                    this.parseFunctionParts(tsResource, ctor, o);
                } else if (isMethodDeclaration(o)) {
                    let method = new TshMethodDeclaration((o.name as Identifier).text);
                    method.parameters = this.parseMethodParams(o);
                    classDeclaration.methods.push(method);
                    this.parseFunctionParts(tsResource, method, o);
                }
            });
        }

        this.parseClassIdentifiers(tsResource, node);

        tsResource.declarations.push(classDeclaration);
    }

    private parseClassIdentifiers(tsResource: TsResource, node: Node): void {
        for (let child of node.getChildren()) {
            switch (child.kind) {
                case SyntaxKind.Identifier:
                    this.parseIdentifier(tsResource, <Identifier>child);
                    break;
            }
            this.parseClassIdentifiers(tsResource, child);
        }
    }

    private parseModule(tsResource: TsResource, node: ModuleDeclaration): TsResource {
        let resource = (node.flags & NodeFlags.Namespace) === NodeFlags.Namespace ? new TsNamespace((node.name as Identifier).text) : new TsModule((node.name as Identifier).text);
        tsResource.resources.push(resource);
        return resource;
    }

    private parseFunctionParts(tsResource: TsResource, parent: TshConstructorDeclaration | TshMethodDeclaration | TshFunctionDeclaration, node: Node): void {
        for (let child of node.getChildren()) {
            switch (child.kind) {
                case SyntaxKind.Identifier:
                    this.parseIdentifier(tsResource, <Identifier>child);
                    break;
                case SyntaxKind.VariableStatement:
                    this.parseVariable(parent, <VariableStatement>child);
                    break;
            }
            this.parseFunctionParts(tsResource, parent, child);
        }
    }

    private parseCtorParams(parent: TshClassDeclaration, ctor: TshConstructorDeclaration, node: ConstructorDeclaration): void {
        if (!node.parameters) {
            return;
        }
        node.parameters.forEach(o => {
            if (isIdentifier(o.name)) {
                ctor.parameters.push(new TshParameterDeclaration((o.name as Identifier).text));
                if (!o.modifiers) {
                    return;
                }
                o.modifiers.forEach(m => {
                    if (m.kind === SyntaxKind.PublicKeyword) {
                        parent.properties.push(new TshPropertyDeclaration((o.name as Identifier).text, PropertyVisibility.Public));
                        return;
                    }
                    if (m.kind === SyntaxKind.ProtectedKeyword) {
                        parent.properties.push(new TshPropertyDeclaration((o.name as Identifier).text, PropertyVisibility.Protected));
                        return;
                    }
                    if (m.kind === SyntaxKind.PrivateKeyword) {
                        parent.properties.push(new TshPropertyDeclaration((o.name as Identifier).text, PropertyVisibility.Private));
                        return;
                    }
                });
            } else if (isObjectBindingPattern(o.name) || isArrayBindingPattern(o.name)) {
                let identifiers = o.name as ObjectBindingPattern | ArrayBindingPattern;
                ctor.parameters = ctor.parameters.concat(identifiers.elements.map((o: BindingElement) => {
                    if (isIdentifier(o.name)) {
                        return new TshParameterDeclaration((o.name as Identifier).text);
                    }
                }).filter(Boolean));
            }
        });
    }

    private parseMethodParams(node: FunctionDeclaration | MethodDeclaration | MethodSignature): TshParameterDeclaration[] {
        return node.parameters.reduce((all: TshParameterDeclaration[], cur: ParameterDeclaration) => {
            if (isIdentifier(cur.name)) {
                all.push(new TshParameterDeclaration((cur.name as Identifier).text));
            } else if (isObjectBindingPattern(cur.name) || isArrayBindingPattern(cur.name)) {
                let identifiers = cur.name as ObjectBindingPattern | ArrayBindingPattern;
                all = all.concat(identifiers.elements.map((o: BindingElement) => {
                    if (isIdentifier(o.name)) {
                        return new TshParameterDeclaration((o.name as Identifier).text);
                    }
                }).filter(Boolean));
            }
            return all;
        }, []);
    }

    private checkExported(node: Node): boolean {
        return (node.flags & NodeFlags.Export) === NodeFlags.Export;
    }
}
