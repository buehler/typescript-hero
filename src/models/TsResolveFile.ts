import {TsFile} from './TsFile';
import {TsImport} from './TsImport';
import {TsExport} from './TsExport';
import {TsDeclaration} from './TsDeclaration';

export class TsResolveFile extends TsFile {
    public imports: TsImport[] = [];
    public declarations: TsDeclaration[] = [];
    public exports: TsExport[] = [];
    public usages: string[] = [];
}
