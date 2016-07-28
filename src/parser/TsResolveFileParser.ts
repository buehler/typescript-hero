import * as vscode from 'vscode';
import {TsResolveFile} from '../models/TsResolveFile';
import {TsStringImport} from '../models/TsImport';
import * as typescript from 'typescript';
import fs = require('fs');
import {SyntaxKind, createSourceFile, ScriptTarget, SourceFile, ImportDeclaration, ImportEqualsDeclaration, Node, StringLiteral} from 'typescript';

const syntaxDefinitions = {
    imports: {
        string: [SyntaxKind.ImportKeyword, SyntaxKind.StringLiteral, SyntaxKind.SemicolonToken]
    }
};

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

        this.syntaxList(tsFile, source.getChildAt(0));

        return tsFile;
    }

    private parseDefinition(source: SourceFile): any { }

    private syntaxList(tsFile: TsResolveFile, node: Node): void {
        for (let child of node.getChildren()) {
            switch (child.kind) {
                case SyntaxKind.ImportDeclaration:
                    this.importDeclaration(tsFile, <ImportDeclaration>child);
                    break;
                case SyntaxKind.ImportEqualsDeclaration:
                    this.importEqualsDeclaration(tsFile, <ImportEqualsDeclaration>child);
                    break;
            }
        }
    }

    private importDeclaration(tsFile: TsResolveFile, node: ImportDeclaration): void {
        let children = node.getChildren();

        if (children.length < 2) {
            return;
        }

        if (children.every((child, idx) => child.kind === syntaxDefinitions.imports.string[idx])) {
            let strLiteral = <StringLiteral>children[1];
            tsFile.imports.push(new TsStringImport(strLiteral.text));
        }
    }

    private importEqualsDeclaration(tsFile: TsResolveFile, node: ImportEqualsDeclaration): void {
    }
}
