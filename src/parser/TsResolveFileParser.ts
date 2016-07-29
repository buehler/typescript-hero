import * as vscode from 'vscode';
import {TsResolveFile} from '../models/TsResolveFile';
import {TsStringImport, TsExternalModuleImport, TsNamespaceImport, TsNamedImport} from '../models/TsImport';
import {TsResolveSpecifier} from '../models/TsResolveSpecifier';
import {TsNamedDeclaration, TsClassDeclaration, TsFunctionDeclaration, TsEnumDeclaration, TsTypeDeclaration, TsInterfaceDeclaration, TsVariableDeclaration} from '../models/TsDeclaration';
import {TsAllExport, TsExport, TsNamedExport} from '../models//TsExport';
import fs = require('fs');
import {SyntaxKind, createSourceFile, ScriptTarget, SourceFile, ImportDeclaration, ImportEqualsDeclaration, Node, StringLiteral, Identifier, VariableStatement} from 'typescript';

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

function allowedIfNotLocalScoped(node: Node) {
    // use mues:
    // - lokali variable ()
    // - lokali parameter (normal & arrow funcs)
}

function importDeclaration(tsFile: TsResolveFile, node: ImportDeclaration): void {
    let children = node.getChildren();

    if (children.length < 2) {
        return;
    }

    let libName = children.find(o => o.kind === SyntaxKind.StringLiteral) as StringLiteral;

    if (children[1].kind === SyntaxKind.StringLiteral) {
        tsFile.imports.push(new TsStringImport(libName.text));
    } else if (children[1].kind === SyntaxKind.ImportClause && children[1].getChildAt(0).kind === SyntaxKind.NamespaceImport) {
        let alias = children[1].getChildAt(0).getChildren().find(o => o.kind === SyntaxKind.Identifier) as Identifier;
        tsFile.imports.push(new TsNamespaceImport(libName.text, alias.text));
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
        tsFile.imports.push(tsImport);
    }
}

function importEqualsDeclaration(tsFile: TsResolveFile, node: ImportEqualsDeclaration): void {
    let children = node.getChildren();
    let alias = children.find(o => o.kind === SyntaxKind.Identifier) as Identifier;
    let libName = children
        .find(o => o.kind === SyntaxKind.ExternalModuleReference)
        .getChildren()
        .find(o => o.kind === SyntaxKind.StringLiteral) as StringLiteral;

    tsFile.imports.push(new TsExternalModuleImport(libName.text, alias.text));
}

function declaration(tsFile: TsResolveFile, node: Node, ctor: new (isExported: boolean, name: string) => TsNamedDeclaration): void {
    let name = node.getChildren().find(o => o.kind === SyntaxKind.Identifier) as Identifier;
    tsFile.declarations.push(new ctor(checkIfExported(node), name.text));
}

function exportDeclaration(tsFile: TsResolveFile, node: Node): void {
    let children = node.getChildren();
    let libName = children.find(o => o.kind === SyntaxKind.StringLiteral) as StringLiteral;

    if (children.some(o => o.kind === SyntaxKind.AsteriskToken)) {
        tsFile.exports.push(new TsAllExport(libName.text));
    } else if (children.some(o => o.kind === SyntaxKind.NamedExports)) {
        let specifiers = [],
            tsExport = new TsNamedExport(libName.text);
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
        tsFile.exports.push(tsExport);
    }
}

function variableDeclaration(tsFile: TsResolveFile, node: VariableStatement): void {
    let isConst = node.declarationList.getChildren().some(o => o.kind === SyntaxKind.ConstKeyword);
    node.declarationList.declarations.forEach(o => tsFile.declarations.push(new TsVariableDeclaration(checkIfExported(node), o.name.getText(), isConst)));
}

function checkIfExported(node: Node): boolean {
    let children = node.getChildren();
    return children.length > 0 &&
        children.filter(o => o.kind === SyntaxKind.SyntaxList).some(o => o.getChildren().some(o => o.kind === SyntaxKind.ExportKeyword));
}

export class TsResolveFileParser {
    public parseFile(filePath: string | vscode.Uri): TsResolveFile {
        let files = this.parseFiles([filePath]);
        return files[0];
    }

    public parseFiles(filePathes: (string | vscode.Uri)[]): TsResolveFile[] {
        return filePathes
            .map(o => typeof o === 'string' ? o : o.fsPath)
            .map(o => createSourceFile(o, fs.readFileSync(o).toString(), ScriptTarget.ES6, true))
            .map(o => o.fileName.endsWith('.d.ts') ? this.parseDefinition(o) : this.parseTypescript(o));
    }

    private parseTypescript(source: SourceFile): TsResolveFile {
        let tsFile = new TsResolveFile(source.fileName);

        let syntaxList = source.getChildAt(0);
        this.parseTypescriptImports(tsFile, syntaxList);
        this.parseTypescriptDeclarations(tsFile, syntaxList);
        this.parseTypescriptUsages(tsFile, syntaxList);

        return tsFile;
    }

    private parseDefinition(source: SourceFile): any { }

    private parseTypescriptImports(tsFile: TsResolveFile, node: Node): void {
        for (let child of node.getChildren()) {
            switch (child.kind) {
                case SyntaxKind.ImportDeclaration:
                    importDeclaration(tsFile, <ImportDeclaration>child);
                    break;
                case SyntaxKind.ImportEqualsDeclaration:
                    importEqualsDeclaration(tsFile, <ImportEqualsDeclaration>child);
                    break;
            }
        }
    }

    private parseTypescriptDeclarations(tsFile: TsResolveFile, node: Node): void {
        for (let child of node.getChildren()) {
            switch (child.kind) {
                case SyntaxKind.ClassDeclaration:
                    declaration(tsFile, child, TsClassDeclaration);
                    break;
                case SyntaxKind.FunctionDeclaration:
                    declaration(tsFile, child, TsFunctionDeclaration);
                    break;
                case SyntaxKind.EnumDeclaration:
                    declaration(tsFile, child, TsEnumDeclaration);
                    break;
                case SyntaxKind.TypeAliasDeclaration:
                    declaration(tsFile, child, TsTypeDeclaration);
                    break;
                case SyntaxKind.InterfaceDeclaration:
                    declaration(tsFile, child, TsInterfaceDeclaration);
                    break;
                case SyntaxKind.VariableStatement:
                    variableDeclaration(tsFile, <VariableStatement>child);
                    break;
                case SyntaxKind.ExportDeclaration:
                    exportDeclaration(tsFile, child);
                    break;
            }
        }
    }

    private parseTypescriptUsages(tsFile: TsResolveFile, node: Node): void {
        for (let child of node.getChildren()) {
            if (child.kind === SyntaxKind.Identifier) {
                if (child.parent && usagePredicates.every(predicate => predicate(child))) {
                    let identifier = <Identifier>child;
                    if (tsFile.usages.indexOf(identifier.text) === -1) {
                        tsFile.usages.push(identifier.text);
                    }
                }
            }

            if (child.getChildCount() > 0) {
                this.parseTypescriptUsages(tsFile, child);
            }
        }
    }
}
