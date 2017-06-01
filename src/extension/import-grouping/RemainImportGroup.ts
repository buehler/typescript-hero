import { GenerationOptions } from '../../common/ts-generation';
import { Import, StringImport } from '../../common/ts-parsing/imports';
import { importSort } from '../utilities/utilityFunctions';
import { ImportGroup } from './ImportGroup';
import { ImportGroupOrder } from './ImportGroupOrder';

/**
 * TODO
 * 
 * @export
 * @class RemainImportGroup
 * @implements {ImportGroup}
 */
export class RemainImportGroup implements ImportGroup {
    public readonly order: ImportGroupOrder = 'asc';
    public readonly imports: Import[] = [];

    public processImport(tsImport: Import): boolean {
        this.imports.push(tsImport);
        return true;
    }

    public generateTypescript(options: GenerationOptions): string {
        const sorted = this.imports.sort((i1, i2) => importSort(i1, i2, this.order));
        return [
            ...sorted.filter(i => i instanceof StringImport),
            ...sorted.filter(i => !(i instanceof StringImport)),
        ].reduce((str, cur) => str + cur.generateTypescript(options), '');
    }
}
