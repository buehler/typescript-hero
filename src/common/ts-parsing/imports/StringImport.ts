import { GenerationOptions } from '../../ts-generation';
import { Import } from './Import';
import { Serializable } from 'ts-json-serializer';

/**
 * Simple string import (i.e. import "reflect-metadata";).
 * 
 * @export
 * @class StringImport
 * @implements {Import}
 */
@Serializable({ factory: json => new StringImport(json.libraryName, json.start, json.end) })
export class StringImport implements Import {
    public get isNew(): boolean {
        return this.start !== undefined && this.end !== undefined;
    }

    constructor(public libraryName: string, public start?: number, public end?: number) { }

    /**
     * Generates typescript code out of the actual import.
     * 
     * @param {GenerationOptions} {stringQuoteStyle, eol}
     * @returns {string}
     * 
     * @memberOf StringImport
     */
    public generateTypescript({ stringQuoteStyle, eol }: GenerationOptions): string {
        return `import ${stringQuoteStyle}${this.libraryName}${stringQuoteStyle}${eol}\n`;
    }

    /**
     * Clone the current import object.
     * 
     * @returns {StringImport}
     * 
     * @memberOf StringImport
     */
    public clone(): StringImport {
        return new StringImport(this.libraryName, this.start, this.end);
    }
}
