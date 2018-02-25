import { Import, StringImport } from 'typescript-parser';

import { importSort } from '../../utilities/utility-functions';
import { ImportGroup } from './import-group';
import { ImportGroupOrder } from './import-group-order';

/**
 * Importgroup that processes all imports that match a certain regex (the lib name).
 *
 * @export
 * @class RegexImportGroup
 * @implements {ImportGroup}
 */
export class RegexImportGroup implements ImportGroup {
  public readonly imports: Import[] = [];

  public get sortedImports(): Import[] {
    const sorted = this.imports.sort((i1, i2) => importSort(i1, i2, this.order));
    return [
      ...sorted.filter(i => i instanceof StringImport),
      ...sorted.filter(i => !(i instanceof StringImport)),
    ];
  }

  /**
   * Creates an instance of RegexImportGroup.
   *
   * @param {string} regex The regex that is matched against the imports library name.
   * @param {ImportGroupOrder} [order='asc']
   *
   * @memberof RegexImportGroup
   */
  constructor(public readonly regex: string, public readonly order: ImportGroupOrder = 'asc') { }

  public reset(): void {
    this.imports.length = 0;
  }

  public processImport(tsImport: Import): boolean {
    let regexString = this.regex;
    regexString = regexString.startsWith('/') ? regexString.substring(1) : regexString;
    regexString = regexString.endsWith('/') ? regexString.substring(0, regexString.length - 1) : regexString;
    const regex = new RegExp(regexString, 'g');

    if (regex.test(tsImport.libraryName)) {
      this.imports.push(tsImport);
      return true;
    }
    return false;
  }
}
