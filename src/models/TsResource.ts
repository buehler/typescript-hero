import {TsDeclaration} from './TsDeclaration';
import {TsExport} from './TsExport';
import {TsImport} from './TsImport';
import {parse, ParsedPath} from 'path';
import {workspace} from 'vscode';

// TsSource can be: File, Module, Namespace
// module contains declarations, imports, exports, submodules

export abstract class TsResource {
    public imports: TsImport[] = [];
    public declarations: TsDeclaration[] = [];
    public exports: TsExport[] = [];
    public resources: TsResource[] = [];
    public usages: string[] = [];
    public abstract getIdentifier(): string;
}

export class TsFile extends TsResource {
    public get parsedPath(): ParsedPath {
        return parse(this.filePath);
    }

    constructor(public filePath: string) {
        super();
    }

    public getIdentifier(): string {
        return workspace.asRelativePath(this.filePath).replace(/([.]d)?[.]ts/g, '');
    }
}

export class TsModule extends TsResource {
    constructor(public name: string) {
        super();
    }

    public getIdentifier(): string {
        return this.name;
    }
}

export class TsNamespace extends TsResource {
    constructor(public name: string) {
        super();
    }

    public getIdentifier(): string {
        return this.name;
    }
}
