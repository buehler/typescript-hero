import {TsFile} from './TsFile';
import {TsImport} from './TsImport';
import {TsExport} from './TsExport';

export class TsResolveFile extends TsFile {
    public imports: TsImport[] = [];
    public exports: TsExport[] = [];
    public usages: string[] = [];
}
