/**
 * Import that imports a whole namespace (i.e. import * as foobar from 'foobar';).
 * 
 * @export
 * @class TsNamespaceImport
 * @extends {TsAliasedImport}
 */
export class NamespaceImport extends TsAliasedImport {
    /**
     * Generate TypeScript (import notation).
     * 
     * @param {TsImportOptions}
     * @returns {string}
     * 
     * @memberOf TsStringImport
     */
    public toImport({eol, pathDelimiter}: TsImportOptions): string {
        return `import * as ${this.alias} from ${pathDelimiter}${this.libraryName}${pathDelimiter}${eol}\n`;
    }

    /**
     * Clone the current import object.
     * 
     * @returns {TsNamespaceImport}
     * 
     * @memberOf TsNamespaceImport
     */
    public clone(): TsNamespaceImport {
        return new TsNamespaceImport(this.libraryName, this.alias, this.start, this.end);
    }
}
