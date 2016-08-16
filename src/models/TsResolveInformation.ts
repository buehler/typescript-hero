import {TsImport} from './TsImport';
import {TsExport} from './TsExport';
import {TsDeclaration} from './TsOldDeclaration';

export interface TsResolveInformation {
    imports: TsImport[];
    declarations: TsDeclaration[];
    exports: TsExport[];
    usages: string[];
    nonLocalUsages: string[];
}
