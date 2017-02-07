/**
 * Alternative to the namespace import. Can be used by various libraries.
 * (i.e. import foobar = require('foobar')).
 * 
 * @export
 * @class TsExternalModuleImport
 * @extends {TsAliasedImport}
 */
export class ExternalModuleImport extends TsAliasedImport {
    /**
     * Generate TypeScript (import notation).
     * 
     * @param {TsImportOptions}
     * @returns {string}
     * 
     * @memberOf TsStringImport
     */
    public toImport({eol, pathDelimiter}: TsImportOptions): string {
        return `import ${this.alias} = require(${pathDelimiter}${this.libraryName}${pathDelimiter})${eol}\n`;
    }

    /**
     * Clone the current import object.
     * 
     * @returns {TsExternalModuleImport}
     * 
     * @memberOf TsExternalModuleImport
     */
    public clone(): TsExternalModuleImport {
        return new TsExternalModuleImport(this.libraryName, this.alias, this.start, this.end);
    }
}
