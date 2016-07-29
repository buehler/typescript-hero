import {TsFile} from './TsFile';
import {TsImport} from './TsImport';
import {TsExport} from './TsExport';
import {TsDeclaration} from './TsDeclaration';

export class TsResolveFile extends TsFile {
    public imports: TsImport[] = [];
    public declarations: TsDeclaration[] = [];
    public exports: TsExport[] = [];
    public usages: string[] = [];

    public get nonLocalUsages(): string[] {
        let usages = [];

        for (let usage of this.usages) {
            if (!this.declarations.some(o => o.name === usage)) {
                usages.push(usage);
            }
        }

        return usages;
    }
}
