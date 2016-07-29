import {TsFile} from './TsFile';
import {TsImport} from './TsImport';
import {TsExport} from './TsExport';
import {TsDeclaration} from './TsDeclaration';
import {TsResolveInformation} from './TsResolveInformation';

export class TsResolveFile extends TsFile implements TsResolveInformation {
    public imports: TsImport[] = [];
    public declarations: TsDeclaration[] = [];
    public exports: TsExport[] = [];
    public usages: string[] = [];

    public get nonLocalUsages(): string[] {
        return this.usages.filter(usage => !this.declarations.some(o => o.name === usage));
    }

    public get libraryName(): string {
        if (this.path.ext === '.ts') {
            return this.path.name;
        }
        let dirSplit = this.path.dir.split('/');

        let nodeIndex = dirSplit.indexOf('node_modules');
        if (nodeIndex > -1 && nodeIndex + 1 <= dirSplit.length) {
            return dirSplit.slice(nodeIndex + 1).join('/');
        }

        return dirSplit[dirSplit.length - 1];
    }
}
