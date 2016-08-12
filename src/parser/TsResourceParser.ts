import {CancellationRequested} from '../models/CancellationRequested';
import {TsDefaultImport, TsExternalModuleImport, TsNamedImport, TsNamespaceImport, TsStringImport} from '../models/TsImport';
import {TsResolveSpecifier} from '../models/TsResolveSpecifier';
import {TsFile, TsResource} from '../models/TsResource';
import {Logger, LoggerFactory} from '../utilities/Logger';
import {isExternalModuleReference, isImportDeclaration, isNamedImports, isNamespaceImport, isStringLiteral} from '../utilities/TypeGuards';
import {readFileSync} from 'fs';
import {inject, injectable} from 'inversify';
import {createSourceFile, ExternalModuleReference, Identifier, ImportDeclaration, ImportEqualsDeclaration, ModuleDeclaration, NamedImports, NamespaceImport, Node, ScriptTarget, SourceFile, StringLiteral, SyntaxKind, VariableStatement} from 'typescript';
import {CancellationToken, Uri} from 'vscode';

// const usageNotAllowedParents = [
//     SyntaxKind.ImportEqualsDeclaration,
//     SyntaxKind.ImportSpecifier,
//     SyntaxKind.NamespaceImport,
//     SyntaxKind.ClassDeclaration,
//     SyntaxKind.ImportDeclaration,
//     SyntaxKind.InterfaceDeclaration,
//     SyntaxKind.ExportDeclaration,
//     SyntaxKind.ExportSpecifier,
//     SyntaxKind.ImportSpecifier,
//     SyntaxKind.FunctionDeclaration,
//     SyntaxKind.EnumDeclaration,
//     SyntaxKind.TypeAliasDeclaration,
//     SyntaxKind.MethodDeclaration,
//     SyntaxKind.PropertyAssignment
// ];

// const usageAllowedIfLast = [
//     SyntaxKind.Parameter,
//     SyntaxKind.PropertyDeclaration,
//     SyntaxKind.VariableDeclaration,
//     SyntaxKind.ElementAccessExpression,
//     SyntaxKind.BinaryExpression
// ];

// const usagePredicates = [
//     (o: Node) => usageNotAllowedParents.indexOf(o.parent.kind) === -1,
//     allowedIfLastIdentifier,
//     allowedIfPropertyAccessFirst
// ];


@injectable()
export class TsResourceParser {
    private logger: Logger;

    constructor( @inject('LoggerFactory') loggerFactory: LoggerFactory) {
        this.logger = loggerFactory('TsResourceParser');
        this.logger.info('Instantiated.');
    }

    public parseSource(source: string): Promise<TsResource> {
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

    public parseFile(file: Uri): Promise<TsResource> {
        return this.parseFiles([file]).then(files => files[0]);
    }

    public parseFiles(filePathes: Uri[], cancellationToken?: CancellationToken): Promise<TsResource[]> {
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

    private parseTypescript(source: SourceFile, cancellationToken?: CancellationToken): TsResource {
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
                //     case SyntaxKind.ImportEqualsDeclaration:
                //         importEqualsDeclaration(tsResolveInfo, <ImportEqualsDeclaration>child);
                //         break;
                //     case SyntaxKind.ClassDeclaration:
                //         declaration(tsResolveInfo, child, TsClassDeclaration);
                //         break;
                //     case SyntaxKind.FunctionDeclaration:
                //         declaration(tsResolveInfo, child, TsFunctionDeclaration);
                //         break;
                //     case SyntaxKind.EnumDeclaration:
                //         declaration(tsResolveInfo, child, TsEnumDeclaration);
                //         break;
                //     case SyntaxKind.TypeAliasDeclaration:
                //         declaration(tsResolveInfo, child, TsTypeDeclaration);
                //         break;
                //     case SyntaxKind.InterfaceDeclaration:
                //         declaration(tsResolveInfo, child, TsInterfaceDeclaration);
                //         break;
                //     case SyntaxKind.Parameter:
                //         parameterDeclaration(tsResolveInfo, child);
                //         break;
                //     case SyntaxKind.VariableStatement:
                //         variableDeclaration(tsResolveInfo, <VariableStatement>child);
                //         break;
                //     case SyntaxKind.ExportDeclaration:
                //         exportDeclaration(tsResolveInfo, child);
                //         break;
                //     case SyntaxKind.ExportAssignment:
                //         exportAssignment(tsResolveInfo, child);
                //         break;
                //     case SyntaxKind.Identifier:
                //         if (child.parent && usagePredicates.every(predicate => predicate(child))) {
                //             let identifier = <Identifier>child;
                //             if (tsResolveInfo.usages.indexOf(identifier.text) === -1) {
                //                 tsResolveInfo.usages.push(identifier.text);
                //             }
                //         }
                //         break;
                //     case SyntaxKind.ModuleDeclaration:
                //         let module = moduleDeclaration(<ModuleDeclaration>child);
                //         tsResolveInfo.declarations.push(module);
                //         this.parse(module, child);
                //         continue;
            }
            //this.parse(tsResolveInfo, child, cancellationToken);
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
}

// function allowedIfLastIdentifier(node: Node): boolean {
//     if (usageAllowedIfLast.indexOf(node.parent.kind) === -1) {
//         return true;
//     }

//     let children = node.parent.getChildren().filter(o => o.kind === SyntaxKind.Identifier);
//     return children.indexOf(node) === 1;
// }

// function allowedIfPropertyAccessFirst(node: Node): boolean {
//     if (node.parent.kind !== SyntaxKind.PropertyAccessExpression) {
//         return true;
//     }

//     let children = node.parent.getChildren();
//     return children.indexOf(node) === 0;
// }

// function importDeclaration(tsResolveInfo: TsResolveInformation, node: ImportDeclaration): void {
//     let children = node.getChildren();

//     if (children.length < 2) {
//         return;
//     }

//     let libName = children.find(o => o.kind === SyntaxKind.StringLiteral) as StringLiteral;

//     if (children[1].kind === SyntaxKind.StringLiteral) {
//         tsResolveInfo.imports.push(new TsStringImport(libName.text));
//     } else if (children[1].kind === SyntaxKind.ImportClause && children[1].getChildAt(0).kind === SyntaxKind.NamespaceImport) {
//         let alias = children[1].getChildAt(0).getChildren().find(o => o.kind === SyntaxKind.Identifier) as Identifier;
//         tsResolveInfo.imports.push(new TsNamespaceImport(libName.text, alias.text));
//     } else if (children[1].kind === SyntaxKind.ImportClause && children[1].getChildAt(0).kind === SyntaxKind.Identifier) {
//         let alias = children[1].getChildAt(0) as Identifier;
//         tsResolveInfo.imports.push(new TsDefaultImport(libName.text, alias.text));
//     } else if (children[1].kind === SyntaxKind.ImportClause && children[1].getChildAt(0).kind === SyntaxKind.NamedImports) {
//         let specifiers = [],
//             tsImport = new TsNamedImport(libName.text);
//         children[1]
//             .getChildAt(0) // NamedImports
//             .getChildAt(1) // SyntaxList
//             .getChildren() // All children
//             .filter(o => o.kind === SyntaxKind.ImportSpecifier)
//             .forEach(o => {
//                 let children = o.getChildren();
//                 let specifier = new TsResolveSpecifier(children[0].getText());
//                 if (children.length === 3 && children.some(c => c.kind === SyntaxKind.AsKeyword)) {
//                     specifier.alias = children[2].getText();
//                 }
//                 specifiers.push(specifier);
//             });
//         tsImport.specifiers = specifiers;
//         tsResolveInfo.imports.push(tsImport);
//     }
// }

// function importEqualsDeclaration(tsResolveInfo: TsResolveInformation, node: ImportEqualsDeclaration): void {
//     let children = node.getChildren();
//     let alias = children.find(o => o.kind === SyntaxKind.Identifier) as Identifier;

//     if (!alias || !children.length) {
//         return;
//     }

//     let moduleRef = children.find(o => o.kind === SyntaxKind.ExternalModuleReference);
//     if (!moduleRef) {
//         return;
//     }
//     let libName = moduleRef.getChildren().find(o => o.kind === SyntaxKind.StringLiteral) as StringLiteral;

//     if (!libName) {
//         return;
//     }

//     tsResolveInfo.imports.push(new TsExternalModuleImport(libName.text, alias.text));
// }

// function declaration(tsResolveInfo: TsResolveInformation, node: Node, ctor: new (name: string, isExported: boolean) => TsExportableDeclaration): void {
//     let name = node.getChildren().find(o => o.kind === SyntaxKind.Identifier) as Identifier;
//     if (!name) {
//         return;
//     }
//     tsResolveInfo.declarations.push(new ctor(name.text, checkIfExported(node)));
// }

// function parameterDeclaration(tsResolveInfo: TsResolveInformation, node: Node): void {
//     let name = node.getChildren().find(o => o.kind === SyntaxKind.Identifier) as Identifier;
//     if (!name) {
//         let objArrBinding = node.getChildren().find(o => o.kind === SyntaxKind.ObjectBindingPattern || o.kind === SyntaxKind.ArrayBindingPattern);
//         if (objArrBinding) {
//             let bindings = objArrBinding.getChildren().find(o => o.kind === SyntaxKind.SyntaxList).getChildren().filter(o => o.kind === SyntaxKind.BindingElement);
//             for (let binding of bindings) {
//                 parameterDeclaration(tsResolveInfo, binding);
//             }
//         }
//         return;
//     }
//     tsResolveInfo.declarations.push(new TsParameterDeclaration(name.text));
// }

// function moduleDeclaration(child: ModuleDeclaration): TsModuleDeclaration {
//     let name: string,
//         isNamespace = false,
//         children = child.getChildren();

//     if (children.some(o => o.kind === SyntaxKind.NamespaceKeyword)) {
//         isNamespace = true;
//         name = (children.find(o => o.kind === SyntaxKind.Identifier) as Identifier).text;
//     } else {
//         name = ((children.find(o => o.kind === SyntaxKind.StringLiteral) as StringLiteral) || (children.find(o => o.kind === SyntaxKind.Identifier) as Identifier)).text;
//     }

//     name = name.replace(/[\"\']/g, '');

//     return new TsModuleDeclaration(name, checkIfExported(child), isNamespace);
// }

// function exportDeclaration(tsResolveInfo: TsResolveInformation, node: Node): void {
//     let children = node.getChildren();
//     let libLiteral = children.find(o => o.kind === SyntaxKind.StringLiteral) as StringLiteral;
//     let libName = libLiteral ? libLiteral.text : undefined;

//     if (children.some(o => o.kind === SyntaxKind.AsteriskToken)) {
//         tsResolveInfo.exports.push(new TsAllFromExport(libName));
//     } else if (children.some(o => o.kind === SyntaxKind.NamedExports)) {
//         let specifiers = [],
//             tsExport = new TsNamedFromExport(libName);
//         children[1]
//             .getChildAt(1) // SyntaxList
//             .getChildren() // All children
//             .filter(o => o.kind === SyntaxKind.ExportSpecifier)
//             .forEach(o => {
//                 let children = o.getChildren();
//                 let specifier = new TsResolveSpecifier(children[0].getText());
//                 if (children.length === 3 && children.some(c => c.kind === SyntaxKind.AsKeyword)) {
//                     specifier.alias = children[2].getText();
//                 }
//                 specifiers.push(specifier);
//             });
//         tsExport.specifiers = specifiers;
//         tsResolveInfo.exports.push(tsExport);
//     }
// }

// function exportAssignment(tsResolveInfo: TsResolveInformation, node: Node): void {
//     if (node.getChildren().find(o => o.kind === SyntaxKind.DefaultKeyword)) {
//         tsResolveInfo.exports.push(new TsDefaultExport());
//     } else {
//         let declarationIdentifier = node.getChildren().find(o => o.kind === SyntaxKind.Identifier) as Identifier;
//         if (!declarationIdentifier) {
//             return;
//         }
//         tsResolveInfo.exports.push(new TsAssignedExport(declarationIdentifier.text, tsResolveInfo.declarations));
//     }
// }

// function variableDeclaration(tsResolveInfo: TsResolveInformation, node: VariableStatement): void {
//     let isConst = node.declarationList.getChildren().some(o => o.kind === SyntaxKind.ConstKeyword);
//     node.declarationList.declarations.forEach(o => tsResolveInfo.declarations.push(new TsVariableDeclaration(checkIfExported(node), o.name.getText(), isConst)));
// }

// function checkIfExported(node: Node): boolean {
//     let children = node.getChildren();
//     return children.length > 0 &&
//         children.filter(o => o.kind === SyntaxKind.SyntaxList).some(o => o.getChildren().some(o => o.kind === SyntaxKind.ExportKeyword));
// }
