import * as vscode from 'vscode';
import {TsResolveFile} from '../models/TsResolveFile';
import {TsStringImport, TsExternalModuleImport, TsNamespaceImport, TsNamedImport} from '../models/TsImport';
import {TsResolveSpecifier} from '../models/TsResolveSpecifier';
import fs = require('fs');
import {SyntaxKind, createSourceFile, ScriptTarget, SourceFile, ImportDeclaration, ImportEqualsDeclaration, Node, StringLiteral, Identifier, ClassDeclaration, FunctionDeclaration, EnumDeclaration, InterfaceDeclaration, VariableStatement, TypeAliasDeclaration} from 'typescript';

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
        let tsFile = new TsResolveFile();

        this.rootSyntaxList(tsFile, source.getChildAt(0));

        return tsFile;
    }

    private parseDefinition(source: SourceFile): any { }

    private rootSyntaxList(tsFile: TsResolveFile, node: Node): void {
        for (let child of node.getChildren()) {
            switch (child.kind) {
                case SyntaxKind.ImportDeclaration:
                    this.importDeclaration(tsFile, <ImportDeclaration>child);
                    break;
                case SyntaxKind.ImportEqualsDeclaration:
                    this.importEqualsDeclaration(tsFile, <ImportEqualsDeclaration>child);
                    break;
                case SyntaxKind.ClassDeclaration:

                    break;
                case SyntaxKind.FunctionDeclaration:

                    break;
                case SyntaxKind.EnumDeclaration:

                    break;
                case SyntaxKind.VariableStatement:

                    break;
                case SyntaxKind.TypeAliasDeclaration:

                    break;
                case SyntaxKind.InterfaceDeclaration:

                    break;
            }
        }
    }

    private importDeclaration(tsFile: TsResolveFile, node: ImportDeclaration): void {
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

    private importEqualsDeclaration(tsFile: TsResolveFile, node: ImportEqualsDeclaration): void {
        let children = node.getChildren();
        let alias = children.find(o => o.kind === SyntaxKind.Identifier) as Identifier;
        let libName = children
            .find(o => o.kind === SyntaxKind.ExternalModuleReference)
            .getChildren()
            .find(o => o.kind === SyntaxKind.StringLiteral) as StringLiteral;

        tsFile.imports.push(new TsExternalModuleImport(libName.text, alias.text));
    }

    private classDeclaration(tsFile: TsResolveFile, node: )
}
