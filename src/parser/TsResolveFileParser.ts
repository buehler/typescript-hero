import * as vscode from 'vscode';
import {TsResolveFile} from '../models/TsResolveFile';
import {TsStringImport, TsExternalModuleImport, TsNamespaceImport, TsNamedImport} from '../models/TsImport';
import {TsResolveSpecifier} from '../models/TsResolveSpecifier';
import {TsExportableDeclaration, TsClassDeclaration, TsFunctionDeclaration, TsEnumDeclaration, TsTypeDeclaration, TsInterfaceDeclaration, TsVariableDeclaration, TsParameterDeclaration, TsModuleDeclaration} from '../models/TsDeclaration';
import {TsAllFromExport, TsNamedFromExport, TsAssignedExport} from '../models/TsExport';
import {TsResolveInformation} from '../models/TsResolveInformation';
import * as inversify from 'inversify';
import fs = require('fs');
import {SyntaxKind, createSourceFile, ScriptTarget, SourceFile, ModuleDeclaration, ImportDeclaration, ImportEqualsDeclaration, Node, StringLiteral, Identifier, VariableStatement} from 'typescript';

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
    SyntaxKind.MethodDeclaration,
    SyntaxKind.PropertyAssignment
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
    return children.indexOf(node) === 1;
}

function allowedIfPropertyAccessFirst(node: Node): boolean {
    if (node.parent.kind !== SyntaxKind.PropertyAccessExpression) {
        return true;
    }

    let children = node.parent.getChildren();
    return children.indexOf(node) === 0;
}

function importDeclaration(tsResolveInfo: TsResolveInformation, node: ImportDeclaration): void {
    let children = node.getChildren();

    if (children.length < 2) {
        return;
    }

    let libName = children.find(o => o.kind === SyntaxKind.StringLiteral) as StringLiteral;

    if (children[1].kind === SyntaxKind.StringLiteral) {
        tsResolveInfo.imports.push(new TsStringImport(libName.text));
    } else if (children[1].kind === SyntaxKind.ImportClause && children[1].getChildAt(0).kind === SyntaxKind.NamespaceImport) {
        let alias = children[1].getChildAt(0).getChildren().find(o => o.kind === SyntaxKind.Identifier) as Identifier;
        tsResolveInfo.imports.push(new TsNamespaceImport(libName.text, alias.text));
    } else if (children[1].kind === SyntaxKind.ImportClause && children[1].getChildAt(0).kind === SyntaxKind.NamedImports) {
        let specifiers = [],
            tsImport = new TsNamedImport(libName.text);
        children[1]
            .getChildAt(0) // NamedImports
            .getChildAt(1) // SyntaxList
            .getChildren() // All children
            .filter(o => o.kind === SyntaxKind.ImportSpecifier)
            .forEach(o => {
                let children = o.getChildren();
                let specifier = new TsResolveSpecifier(children[0].getText());
                if (children.length === 3 && children.some(c => c.kind === SyntaxKind.AsKeyword)) {
                    specifier.alias = children[2].getText();
                }
                specifiers.push(specifier);
            });
        tsImport.specifiers = specifiers;
        tsResolveInfo.imports.push(tsImport);
    }
}

function importEqualsDeclaration(tsResolveInfo: TsResolveInformation, node: ImportEqualsDeclaration): void {
    let children = node.getChildren();
    let alias = children.find(o => o.kind === SyntaxKind.Identifier) as Identifier;
    let libName = children
        .find(o => o.kind === SyntaxKind.ExternalModuleReference)
        .getChildren()
        .find(o => o.kind === SyntaxKind.StringLiteral) as StringLiteral;

    tsResolveInfo.imports.push(new TsExternalModuleImport(libName.text, alias.text));
}

function declaration(tsResolveInfo: TsResolveInformation, node: Node, ctor: new (name: string, isExported: boolean) => TsExportableDeclaration): void {
    let name = node.getChildren().find(o => o.kind === SyntaxKind.Identifier) as Identifier;
    if (!name) {
        return;
    }
    tsResolveInfo.declarations.push(new ctor(name.text, checkIfExported(node)));
}

function parameterDeclaration(tsResolveInfo: TsResolveInformation, node: Node): void {
    let name = node.getChildren().find(o => o.kind === SyntaxKind.Identifier) as Identifier;
    if (!name) {
        let objArrBinding = node.getChildren().find(o => o.kind === SyntaxKind.ObjectBindingPattern || o.kind === SyntaxKind.ArrayBindingPattern);
        if (objArrBinding) {
            let bindings = objArrBinding.getChildren().find(o => o.kind === SyntaxKind.SyntaxList).getChildren().filter(o => o.kind === SyntaxKind.BindingElement);
            for (let binding of bindings) {
                parameterDeclaration(tsResolveInfo, binding);
            }
        }
        return;
    }
    tsResolveInfo.declarations.push(new TsParameterDeclaration(name.text));
}

function moduleDeclaration(child: ModuleDeclaration): TsModuleDeclaration {
    let name: string,
        isNamespace = false,
        children = child.getChildren();

    if (children.some(o => o.kind === SyntaxKind.NamespaceKeyword)) {
        isNamespace = true;
        name = (children.find(o => o.kind === SyntaxKind.Identifier) as Identifier).text;
    } else {
        name = ((children.find(o => o.kind === SyntaxKind.StringLiteral) as StringLiteral) || (children.find(o => o.kind === SyntaxKind.Identifier) as Identifier)).text;
    }

    name = name.replace(/[\"\']/g, '');

    return new TsModuleDeclaration(name, checkIfExported(child), isNamespace);
}

function exportDeclaration(tsResolveInfo: TsResolveInformation, node: Node): void {
    let children = node.getChildren();
    let libLiteral = children.find(o => o.kind === SyntaxKind.StringLiteral) as StringLiteral;
    let libName = libLiteral ? libLiteral.text : undefined;

    if (children.some(o => o.kind === SyntaxKind.AsteriskToken)) {
        tsResolveInfo.exports.push(new TsAllFromExport(libName));
    } else if (children.some(o => o.kind === SyntaxKind.NamedExports)) {
        let specifiers = [],
            tsExport = new TsNamedFromExport(libName);
        children[1]
            .getChildAt(1) // SyntaxList
            .getChildren() // All children
            .filter(o => o.kind === SyntaxKind.ExportSpecifier)
            .forEach(o => {
                let children = o.getChildren();
                let specifier = new TsResolveSpecifier(children[0].getText());
                if (children.length === 3 && children.some(c => c.kind === SyntaxKind.AsKeyword)) {
                    specifier.alias = children[2].getText();
                }
                specifiers.push(specifier);
            });
        tsExport.specifiers = specifiers;
        tsResolveInfo.exports.push(tsExport);
    }
}

function exportAssignment(tsResolveInfo: TsResolveInformation, node: Node): void {
    let declarationIdentifier = node.getChildren().find(o => o.kind === SyntaxKind.Identifier) as Identifier;
    tsResolveInfo.exports.push(new TsAssignedExport(declarationIdentifier.text, tsResolveInfo.declarations));
}

function variableDeclaration(tsResolveInfo: TsResolveInformation, node: VariableStatement): void {
    let isConst = node.declarationList.getChildren().some(o => o.kind === SyntaxKind.ConstKeyword);
    node.declarationList.declarations.forEach(o => tsResolveInfo.declarations.push(new TsVariableDeclaration(checkIfExported(node), o.name.getText(), isConst)));
}

function checkIfExported(node: Node): boolean {
    let children = node.getChildren();
    return children.length > 0 &&
        children.filter(o => o.kind === SyntaxKind.SyntaxList).some(o => o.getChildren().some(o => o.kind === SyntaxKind.ExportKeyword));
}

@inversify.injectable()
export class TsResolveFileParser {
    public parseFile(filePath: string | vscode.Uri): TsResolveFile {
        let files = this.parseFiles([filePath]);
        return files[0];
    }

    public parseFiles(filePathes: (string | vscode.Uri)[]): TsResolveFile[] {
        return filePathes
            .map(o => typeof o === 'string' ? o : o.fsPath)
            .map(o => createSourceFile(o, fs.readFileSync(o).toString(), ScriptTarget.ES6, true))
            .map(o => this.parseTypescript(o));
    }

    private parseTypescript(source: SourceFile): TsResolveFile {
        let tsFile = new TsResolveFile(source.fileName);

        let syntaxList = source.getChildAt(0);
        this.parseDeclarations(tsFile, syntaxList);

        return tsFile;
    }

    private parseDeclarations(tsResolveInfo: TsResolveInformation, node: Node): void {
        for (let child of node.getChildren()) {
            switch (child.kind) {
                case SyntaxKind.ImportDeclaration:
                    importDeclaration(tsResolveInfo, <ImportDeclaration>child);
                    break;
                case SyntaxKind.ImportEqualsDeclaration:
                    importEqualsDeclaration(tsResolveInfo, <ImportEqualsDeclaration>child);
                    break;
                case SyntaxKind.ClassDeclaration:
                    declaration(tsResolveInfo, child, TsClassDeclaration);
                    break;
                case SyntaxKind.FunctionDeclaration:
                    declaration(tsResolveInfo, child, TsFunctionDeclaration);
                    break;
                case SyntaxKind.EnumDeclaration:
                    declaration(tsResolveInfo, child, TsEnumDeclaration);
                    break;
                case SyntaxKind.TypeAliasDeclaration:
                    declaration(tsResolveInfo, child, TsTypeDeclaration);
                    break;
                case SyntaxKind.InterfaceDeclaration:
                    declaration(tsResolveInfo, child, TsInterfaceDeclaration);
                    break;
                case SyntaxKind.Parameter:
                    parameterDeclaration(tsResolveInfo, child);
                    break;
                case SyntaxKind.VariableStatement:
                    variableDeclaration(tsResolveInfo, <VariableStatement>child);
                    break;
                case SyntaxKind.ExportDeclaration:
                    exportDeclaration(tsResolveInfo, child);
                    break;
                case SyntaxKind.ExportAssignment:
                    exportAssignment(tsResolveInfo, child);
                    break;
                case SyntaxKind.Identifier:
                    if (child.parent && usagePredicates.every(predicate => predicate(child))) {
                        let identifier = <Identifier>child;
                        if (tsResolveInfo.usages.indexOf(identifier.text) === -1) {
                            tsResolveInfo.usages.push(identifier.text);
                        }
                    }
                    break;
                case SyntaxKind.ModuleDeclaration:
                    let module = moduleDeclaration(<ModuleDeclaration>child);
                    tsResolveInfo.declarations.push(module);
                    this.parseDeclarations(module, child);
                    continue;
            }
            this.parseDeclarations(tsResolveInfo, child);
        }
    }
}
