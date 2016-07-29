import {TsResolveSpecifier} from './TsResolveSpecifier';

export abstract class TsExport {
    constructor(public from: string) { }
}

export class TsAllExport extends TsExport {
}

export class TsNamedExport extends TsExport {
    public specifiers: TsResolveSpecifier[];
}
