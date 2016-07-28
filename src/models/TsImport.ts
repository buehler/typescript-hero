import {TsResolveSpecifier} from './TsResolveSpecifier';

export abstract class TsImport {
    constructor(public name: string) { }
}

export abstract class TsAliasedImport extends TsImport {
    public alias: string;
}

export class TsStringImport extends TsImport {
    constructor(name: string) {
        super(name);
    }
}

export class TsNamedImport extends TsImport {
    public specifiers: TsResolveSpecifier[];
}

export class TsNamespaceImport extends TsAliasedImport {
}

export class TsExternalModuleImport extends TsAliasedImport {
}
