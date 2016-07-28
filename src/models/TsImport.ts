import {TsImportSpecifier} from './TsImportSpecifier';

export abstract class TsImport {
    public name: string;
}

export abstract class TsAliasedImport extends TsImport {
    public alias: string;
}

export class TsStringImport extends TsImport {
}

export class TsNamedImport extends TsImport {
    public specifiers: TsImportSpecifier[];
}

export class TsNamespaceImport extends TsAliasedImport {
}

export class TsExternalModuleImport extends TsAliasedImport {
}
