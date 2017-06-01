import { GenerationOptions } from '../../common/ts-generation';
import { Import, StringImport } from '../../common/ts-parsing/imports';
import { importSort } from '../utilities/utilityFunctions';
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

    public processImport(tsImport: Import): boolean {
        const regex = new RegExp(this.regex.replace(/\//g, ''), 'g');

        if (regex.test(tsImport.libraryName)) {
            this.imports.push(tsImport);
            return true;
        }
        return false;
    }

    public generateTypescript(options: GenerationOptions): string {
        const sorted = this.imports.sort((i1, i2) => importSort(i1, i2, this.order));
        return [
            ...sorted.filter(i => i instanceof StringImport),
            ...sorted.filter(i => !(i instanceof StringImport)),
        ].reduce((str, cur) => str + cur.generateTypescript(options), '');
    }
}
