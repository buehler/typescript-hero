/**
 * Default import. Imports the default exports of a file.
 * (i.e. import foobar from ...).
 * 
 * @export
 * @class TsDefaultImport
 * @extends {TsAliasedImport}
 */
export class DefaultImport extends TsAliasedImport {
    /**
     * Generate TypeScript (import notation).
     * 
     * @param {TsImportOptions}
     * @returns {string}
     * 
     * @memberOf TsStringImport
     */
    public toImport({eol, pathDelimiter}: TsImportOptions): string {
        return `import ${this.alias} from ${pathDelimiter}${this.libraryName}${pathDelimiter}${eol}\n`;
    }

    /**
     * Clone the current import object.
     * 
     * @returns {TsDefaultImport}
     * 
     * @memberOf TsDefaultImport
     */
    public clone(): TsDefaultImport {
        return new TsDefaultImport(this.libraryName, this.alias, this.start, this.end);
    }
}
