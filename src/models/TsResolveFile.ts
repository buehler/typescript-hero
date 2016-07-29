import {TsFile} from './TsFile';
import {TsImport} from './TsImport';
import {TsExport} from './TsExport';
import {TsDeclaration, TsExportableDeclaration} from './TsDeclaration';

export class TsResolveFile extends TsFile {
    public imports: TsImport[] = [];
    public declarations: TsDeclaration[] = [];
    public exports: TsExport[] = [];
    public usages: string[] = [];

    public get nonLocalUsages(): string[] {
        return this.usages.filter(usage => !this.declarations.some(o => o.name === usage));
    }

    public get exportedDeclarations(): TsDeclaration[] {
        return this.declarations.filter(o => o instanceof TsExportableDeclaration && o.isExported);
    }
}
