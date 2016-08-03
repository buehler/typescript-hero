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

    public get moduleNamespaceName(): string {
        return this.name.split(/[-_]/).reduce((all, cur, idx) => {
            if (idx === 0) {
                return all + cur.toLowerCase();
            } else {
                return all + cur.charAt(0).toUpperCase() + cur.substring(1).toLowerCase();
            }
        }, '');
    }

    constructor(name: string, isExported: boolean, public isNamespace: boolean) {
        super(name, isExported);
    }
}
