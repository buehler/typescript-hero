import {TsResolveSpecifier} from './TsResolveSpecifier';

export abstract class TsImport {
    constructor(public libraryName: string) { }
}

export abstract class TsAliasedImport extends TsImport {
    constructor(libraryName: string, public alias: string) {
        super(libraryName);
    }
}

export class TsStringImport extends TsImport {
    constructor(libraryName: string) {
        super(libraryName);
    }
}

export class TsNamedImport extends TsImport {
    public specifiers: TsResolveSpecifier[] = [];

    constructor(libraryName: string) {
        super(libraryName);
    }
}

export class TsNamespaceImport extends TsAliasedImport {
    constructor(libraryName: string, alias: string) {
        super(libraryName, alias);
    }
}

export class TsExternalModuleImport extends TsAliasedImport {
    constructor(libraryName: string, alias: string) {
        super(libraryName, alias);
    }
}
