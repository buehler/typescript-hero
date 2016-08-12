import {CancellationRequested} from '../models/CancellationRequested';
import {TsAllFromExport, TsAssignedExport, TsDefaultExport, TsNamedFromExport} from '../models/TsExport';
import {TsDefaultImport, TsExternalModuleImport, TsNamedImport, TsNamespaceImport, TsStringImport} from '../models/TsImport';
import {TsResolveSpecifier} from '../models/TsResolveSpecifier';
import {TsFile, TsResource} from '../models/TsResource';
import {Logger, LoggerFactory} from '../utilities/Logger';
import {isExportDeclaration, isExternalModuleReference, isImportDeclaration, isNamedExports, isNamedImports, isNamespaceImport, isStringLiteral} from '../utilities/TypeGuards';
import {readFileSync} from 'fs';
import {inject, injectable} from 'inversify';
import {createSourceFile, ExportAssignment, ExportDeclaration, ExternalModuleReference, Identifier, ImportDeclaration, ImportEqualsDeclaration, ModuleDeclaration, NamedImports, NamespaceImport, Node, ScriptTarget, SourceFile, StringLiteral, SyntaxKind, VariableStatement} from 'typescript';
import {CancellationToken, Uri} from 'vscode';

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
                case SyntaxKind.ExportDeclaration:
                case SyntaxKind.ExportAssignment:
                    this.parseExport(tsResource, <ExportAssignment | ExportDeclaration>child);
                    break;
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
            if (node.isExportEquals) {
                let literal = node.expression as Identifier;
                tsResource.exports.push(new TsAssignedExport(literal.text, tsResource.declarations));
            } else {
                tsResource.exports.push(new TsDefaultExport());
            }
        }
    }
}
