import { GenerationOptions } from '../../common/ts-generation';
import { Import } from '../../common/ts-parsing/imports';
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

    public processImport(tsImport: Import): void {
        this.imports.push(tsImport);
    }

    public generateTypescript(options: GenerationOptions): string {
        return this.imports.reduce((str, cur) => str + cur.generateTypescript(options), '');
    }
}
