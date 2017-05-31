import { GenerationOptions } from '../../common/ts-generation';
import { Import } from '../../common/ts-parsing/imports';
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

    public processImport(_tsImport: Import): void {
        throw new Error('Not implemented yet.');
    }

    public generateTypescript(options: GenerationOptions): string {
        return this.imports.reduce((str, cur) => str + cur.generateTypescript(options), '');
    }
}
