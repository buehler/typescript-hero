import {TsResolveSpecifier} from './TsResolveSpecifier';
import {TsDeclaration} from './TsDeclaration';

export abstract class TsExport {
}

export abstract class TsFromExport {
    constructor(public from?: string) { }
}

export class TsAllFromExport extends TsFromExport {
}

export class TsNamedFromExport extends TsFromExport {
    public specifiers: TsResolveSpecifier[];
}

export class TsAssignedExport extends TsExport {
    public get declarations(): TsDeclaration[] {
        return this._declarations.filter(o => o.name === this.declarationIdentifier);
    }

    constructor(public declarationIdentifier: string, private _declarations: TsDeclaration[]) {
        super();
    }
}

export class TsDefaultExport extends TsExport {
}
