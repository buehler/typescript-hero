import {TsFile} from './TsFile';
import {TsImport} from './TsImport';
import {TsExport} from './TsExport';
import {TsDeclaration} from './TsOldDeclaration';
import {TsResolveInformation} from './TsResolveInformation';

export class TsResolveFile extends TsFile implements TsResolveInformation {
    public imports: TsImport[] = [];
    public declarations: TsDeclaration[] = [];
    public exports: TsExport[] = [];
    public usages: string[] = [];

    public get nonLocalUsages(): string[] {
        return this.usages.filter(usage => !this.declarations.some(o => o.name === usage));
    }

    public get isDeclarationFile(): boolean {
        return this.path.ext === '.d.ts';
    }
}
