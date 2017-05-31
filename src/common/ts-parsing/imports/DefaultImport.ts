import { GenerationOptions } from '../../ts-generation';
import { AliasedImport } from './Import';
import { Serializable } from 'ts-json-serializer';

/**
 * Default import. Imports the default exports of a file.
 * (i.e. import foobar from ...).
 * 
 * @export
 * @class DefaultImport
 * @implements {AliasedImport}
 */
@Serializable({ factory: json => new DefaultImport(json.libraryName, json.alias, json.start, json.end) })
export class DefaultImport implements AliasedImport {
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
     * @memberof DefaultImport
     */
    public generateTypescript({ stringQuoteStyle, eol }: GenerationOptions): string {
        return `import ${this.alias} from ${stringQuoteStyle}${this.libraryName}${stringQuoteStyle}${eol}\n`;
    }

    /**
     * Clone the current import object.
     * 
     * @returns {DefaultImport}
     * 
     * @memberof DefaultImport
     */
    public clone(): DefaultImport {
        return new DefaultImport(this.libraryName, this.alias, this.start, this.end);
    }
}
