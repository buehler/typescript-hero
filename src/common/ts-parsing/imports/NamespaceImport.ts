import { GenerationOptions } from '../../ts-generation';
import { AliasedImport } from './Import';
import { Serializable } from 'ts-json-serializer';

/**
 * Import that imports a whole namespace (i.e. import * as foobar from 'foobar';).
 * 
 * @export
 * @class TsNamespaceImport
 * @implements {AliasedImport}
 */
@Serializable({ factory: json => new NamespaceImport(json.libraryName, json.alias, json.start, json.end) })
export class NamespaceImport implements AliasedImport {
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
     * @memberof NamespaceImport
     */
    public generateTypescript({ stringQuoteStyle, eol }: GenerationOptions): string {
        return `import * as ${this.alias} from ${stringQuoteStyle}${this.libraryName}${stringQuoteStyle}${eol}\n`;
    }

    /**
     * Clone the current import object.
     * 
     * @returns {NamespaceImport}
     * 
     * @memberof NamespaceImport
     */
    public clone(): NamespaceImport {
        return new NamespaceImport(this.libraryName, this.alias, this.start, this.end);
    }
}
