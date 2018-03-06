import { Import, StringImport } from 'typescript-parser';

import { importSort } from '../../utilities/utility-functions';
import { ImportGroup } from './import-group';
import { ImportGroupOrder } from './import-group-order';

/**
 * Importgroup that processes all imports. Should be used if other groups don't process the import.
 *
 * @export
 * @class RemainImportGroup
 * @implements {ImportGroup}
 */
export class RemainImportGroup implements ImportGroup {
  public readonly imports: Import[] = [];

  public get sortedImports(): Import[] {
    const sorted = this.imports.sort((i1, i2) => importSort(i1, i2, this.order));
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
