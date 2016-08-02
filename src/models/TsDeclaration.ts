import {TsResolveInformation} from './TsResolveInformation';
import {TsImport} from './TsImport';
import {TsExport} from './TsExport';

export abstract class TsDeclaration {
    constructor(public name: string) { }
}

export abstract class TsExportableDeclaration extends TsDeclaration {
    constructor(name: string, public isExported: boolean) {
        super(name);
    }
}

export class TsClassDeclaration extends TsExportableDeclaration {
}

export class TsFunctionDeclaration extends TsExportableDeclaration {
}

export class TsEnumDeclaration extends TsExportableDeclaration {
}

export class TsTypeDeclaration extends TsExportableDeclaration {
}

export class TsInterfaceDeclaration extends TsExportableDeclaration {
}

export class TsVariableDeclaration extends TsExportableDeclaration {
    constructor(isExported: boolean, name: string, public isConst: boolean) {
        super(name, isExported);
    }
}

export class TsParameterDeclaration extends TsDeclaration { }

export class TsModuleDeclaration extends TsExportableDeclaration implements TsResolveInformation {
    public imports: TsImport[] = [];
    public declarations: TsDeclaration[] = [];
    public exports: TsExport[] = [];
    public usages: string[] = [];

    public get nonLocalUsages(): string[] {
        return this.usages.filter(usage => !this.declarations.some(o => o.name === usage));
    }

    constructor(name: string, isExported: boolean, public isNamespace: boolean) {
        super(name, isExported);
    }
}
