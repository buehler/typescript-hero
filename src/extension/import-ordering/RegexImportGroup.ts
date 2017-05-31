import { GenerationOptions } from '../../common/ts-generation';
import { Import } from '../../common/ts-parsing/imports';
import { ImportGroup } from './ImportGroup';
import { ImportGroupOrder } from './ImportGroupOrder';

/**
 * TODO
 * 
 * @export
 * @class RegexImportGroup
 * @implements {ImportGroup}
 */
export class RegexImportGroup implements ImportGroup {
    public readonly imports: Import[] = [];

    constructor(public readonly regex: string, public readonly order: ImportGroupOrder = 'asc') { }

    public processImport(_tsImport: Import): void {
        throw new Error('Not implemented yet.');
    }

    public generateTypescript(options: GenerationOptions): string {
        return this.imports.reduce((str, cur) => str + cur.generateTypescript(options), '');
    }
}
