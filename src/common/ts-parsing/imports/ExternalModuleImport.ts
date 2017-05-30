import { GenerationOptions } from '../../ts-generation';
import { AliasedImport } from './Import';
import { Serializable } from 'ts-json-serializer';

/**
 * Alternative to the namespace import. Can be used by various libraries.
 * (i.e. import foobar = require('foobar')).
 * 
 * @export
 * @class ExternalModuleImport
 * @implements {AliasedImport}
 */
@Serializable({ factory: json => new ExternalModuleImport(json.libraryName, json.alias, json.start, json.end) })
export class ExternalModuleImport implements AliasedImport {
    public get isNew(): boolean {
        return this.start !== undefined && this.end !== undefined;
    }

    constructor(public libraryName: string, public alias: string, public start?: number, public end?: number) { }

    /**
     * Generates typescript code out of the actual import.
     * 
     * @param {GenerationOptions} {stringQuoteStyle, eol}
     * @returns {string}
     * 
     * @memberOf ExternalModuleImport
     */
    public generateTypescript({stringQuoteStyle, eol}: GenerationOptions): string {
        return `import ${this.alias} = require(${stringQuoteStyle}${this.libraryName}${stringQuoteStyle})${eol}\n`;
    }

    /**
     * Clone the current import object.
     * 
     * @returns {ExternalModuleImport}
     * 
     * @memberOf ExternalModuleImport
     */
    public clone(): ExternalModuleImport {
        return new ExternalModuleImport(this.libraryName, this.alias, this.start, this.end);
    }
}
