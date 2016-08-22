import {TsDeclaration} from './TsDeclaration';
import {TsExport} from './TsExport';
import {TsImport} from './TsImport';
import {ParsedPath, parse} from 'path';

// TsSource can be: File, Module, Namespace
// module contains declarations, imports, exports, submodules

export abstract class TsResource {
    public imports: TsImport[] = [];
    public declarations: TsDeclaration[] = [];
    public exports: TsExport[] = [];
    public resources: TsResource[] = [];
    public usages: string[] = [];
}

export class TsFile extends TsResource {
    public get parsedPath(): ParsedPath {
        return parse(this.filePath);
    }

    constructor(public filePath: string) {
        super();
    }
}

export class TsModule extends TsResource {
    constructor(public name: string) {
        super();
    }
}

export class TsNamespace extends TsResource {
    constructor(public name: string) {
        super();
    }
}
