import { importSort } from '../utilities/utilityFunctions';
import { GenerationOptions } from '../../common/ts-generation';
import { Import, StringImport } from '../../common/ts-parsing/imports';
import { ImportGroup } from './ImportGroup';
import { ImportGroupKeyword } from './ImportGroupKeyword';
import { ImportGroupOrder } from './ImportGroupOrder';

/**
 * TODO
 * 
 * @export
 * @class KeywordImportGroup
 * @implements {ImportGroup}
 */
export class KeywordImportGroup implements ImportGroup {
    public readonly imports: Import[] = [];

    constructor(public readonly keyword: ImportGroupKeyword, public readonly order: ImportGroupOrder = 'asc') { }

    public processImport(tsImport: Import): boolean {
        switch (this.keyword) {
            case ImportGroupKeyword.Modules:
                return this.processModulesImport(tsImport);
            case ImportGroupKeyword.Plains:
                return this.processPlainsImport(tsImport);
            case ImportGroupKeyword.Workspace:
                return this.processWorkspaceImport(tsImport);
            default:
                return false;
        }
    }

    public generateTypescript(options: GenerationOptions): string {
        return this.imports
            .sort((i1, i2) => importSort(i1, i2, this.order))
            .reduce((str, cur) => str + cur.generateTypescript(options), '');
    }

    private processModulesImport(tsImport: Import): boolean {
        if (
            tsImport instanceof StringImport ||
            tsImport.libraryName.startsWith('.') ||
            tsImport.libraryName.startsWith('/')
        ) {
            return false;
        }
        this.imports.push(tsImport);
        return true;
    }

    private processPlainsImport(tsImport: Import): boolean {
        if (!(tsImport instanceof StringImport)) {
            return false;
        }
        this.imports.push(tsImport);
        return true;
    }

    private processWorkspaceImport(tsImport: Import): boolean {
        if (
            tsImport instanceof StringImport ||
            (
                !tsImport.libraryName.startsWith('.') &&
                !tsImport.libraryName.startsWith('/')
            )
        ) {
            return false;
        }
        this.imports.push(tsImport);
        return true;
    }
}
