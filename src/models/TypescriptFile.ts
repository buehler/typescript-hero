import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';

export class TypescriptFile {
    public path: path.ParsedPath;
    public content: string[];

    public get pathSegments(): number {
        return this.path.dir.split(path.sep).length;
    }

    public get defintion(): boolean {
        return this.path.base.endsWith('.d.ts');
    }

    public get typings(): boolean {
        return this.path.dir.indexOf(`typings${path.sep}`) > -1 && this.path.dir.indexOf(`node_modules${path.sep}`) === -1;
    }

    public get nodeModule(): boolean {
        return this.path.dir.indexOf(`node_modules${path.sep}`) > -1;
    }

    constructor(private uri: vscode.Uri) {
        this.path = path.parse(uri.fsPath);
        this.content = fs.readFileSync(uri.fsPath).toString().split(/(\r?\n)/g);
    }
}
