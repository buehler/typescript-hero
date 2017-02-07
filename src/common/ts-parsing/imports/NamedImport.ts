/**
 * Basic typescript import (ES6 style). Does contain multiple symbols of a file and converts
 * itself to a multiline import if the threshold is reached.
 * (i.e. import {Foobar} from ...).
 * 
 * @export
 * @class TsNamedImport
 * @extends {TsImport}
 */
export class NamedImport extends TsImport {
    public specifiers: TsResolveSpecifier[] = [];

    /**
     * Generate TypeScript (import notation).
     * 
     * @param {TsImportOptions} options
     * @returns {string}
     * 
     * @memberOf TsNamedImport
     */
    public toImport(options: TsImportOptions): string {
        let {eol, pathDelimiter, spaceBraces, multiLineWrapThreshold} = options,
            space = spaceBraces ? ' ' : '',
            specifiers = this.specifiers.sort(this.specifierSort).map(o => o.toImport()).join(', '),
            lib = this.libraryName;

        let importString = `import {${space}${specifiers}${space}} from ${pathDelimiter}${lib}${pathDelimiter}${eol}\n`;
        if (importString.length > multiLineWrapThreshold) {
            return this.toMultiLineImport(options);
        }
        return importString;
    }

    /**
     * Clone the current import object.
     * 
     * @returns {TsNamedImport}
     * 
     * @memberOf TsNamedImport
     */
    public clone(): TsNamedImport {
        let clone = new TsNamedImport(this.libraryName, this.start, this.end);
        clone.specifiers = this.specifiers.map(o => o.clone());
        return clone;
    }

    /**
     * Converts the named import into a multiline import.
     * 
     * @param {TsImportOptions} {pathDelimiter, tabSize}
     * @returns {string}
     * 
     * @memberOf TsNamedImport
     */
    public toMultiLineImport({eol, pathDelimiter, tabSize}: TsImportOptions): string {
        let spacings = Array(tabSize + 1).join(' ');
        return `import {
${this.specifiers.sort(this.specifierSort).map(o => `${spacings}${o.toImport()}`).join(',\n')}
} from ${pathDelimiter}${this.libraryName}${pathDelimiter}${eol}\n`;
    }

    /**
     * Sorts the specifiers by name. Sorting function that is passed to [].sort().
     * 
     * @private
     * @param {TsResolveSpecifier} i1
     * @param {TsResolveSpecifier} i2
     * @returns {number} - Sort index
     * 
     * @memberOf TsNamedImport
     */
    private specifierSort(i1: TsResolveSpecifier, i2: TsResolveSpecifier): number {
        let strA = i1.specifier.toLowerCase(),
            strB = i2.specifier.toLowerCase();

        if (strA < strB) {
            return -1;
        } else if (strA > strB) {
            return 1;
        }
        return 0;
    }
}
