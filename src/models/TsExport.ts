import {TsResolveSpecifier} from './TsResolveSpecifier';
import {TsDeclaration} from './TsDeclaration';

export abstract class TsExport {
}

export abstract class TsFromExport {
    constructor(public from: string) { }
}

export class TsAllFromExport extends TsFromExport {
}

export class TsNamedFromExport extends TsFromExport {
    public specifiers: TsResolveSpecifier[];
}

export class TsAssignedExport extends TsExport {
    public get declaration(): TsDeclaration {
        return this.declarations.find(o => o.name === this.declarationIdentifier);
    }

    constructor(public declarationIdentifier: string, private declarations: TsDeclaration[]) {
        super();
    }
}
