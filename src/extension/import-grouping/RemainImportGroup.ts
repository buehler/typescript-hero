import { Import, StringImport } from 'typescript-parser';

import { ConfigFactory } from '../../common/factories';
import { IocDecorators } from '../IoC';
import { iocSymbols } from '../IoCSymbols';
import { importSort, importSortByFirstSpecifier } from '../utilities/utilityFunctions';
import { ImportGroup } from './ImportGroup';
import { ImportGroupOrder } from './ImportGroupOrder';

/**
 * Importgroup that processes all imports. Should be used if other groups don't process the import.
 *
 * @export
 * @class RemainImportGroup
 * @implements {ImportGroup}
 */
export class RemainImportGroup implements ImportGroup {
    public readonly imports: Import[] = [];

    @IocDecorators.lazyInject(iocSymbols.configuration)
    private config: ConfigFactory;

    public get sortedImports(): Import[] {
        const config = this.config(null);
        const sorter = config.resolver.organizeSortsByFirstSpecifier ? importSortByFirstSpecifier : importSort;
        const sorted = this.imports.sort((i1, i2) => sorter(i1, i2, this.order));
        return [
            ...sorted.filter(i => i instanceof StringImport),
            ...sorted.filter(i => !(i instanceof StringImport)),
        ];
    }

    constructor(public readonly order: ImportGroupOrder = 'asc') { }

    public reset(): void {
        this.imports.length = 0;
    }

    public processImport(tsImport: Import): boolean {
        this.imports.push(tsImport);
        return true;
    }
}
