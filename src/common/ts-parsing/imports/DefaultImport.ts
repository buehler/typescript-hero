import { GenerationOptions } from '../../ts-generation';
import { AliasedImport, importRange } from './Import';
import { Serializable } from 'ts-json-serializer';
import { Range, TextDocument } from 'vscode-languageserver-types';

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
     * @memberOf DefaultImport
     */
    public generateTypescript({stringQuoteStyle, eol}: GenerationOptions): string {
        return `import ${this.alias} from ${stringQuoteStyle}${this.libraryName}${stringQuoteStyle}${eol}\n`;
    }

    /**
     * Calculates the document range of the node in the given document.
     * 
     * @param {TextDocument} document
     * @returns {Range}
     * 
     * @memberOf DefaultImport
     */
    public getRange(document: TextDocument): Range {
        return importRange(document, this.start, this.end);
    }

    /**
     * Clone the current import object.
     * 
     * @returns {DefaultImport}
     * 
     * @memberOf DefaultImport
     */
    public clone(): DefaultImport {
        return new DefaultImport(this.libraryName, this.alias, this.start, this.end);
    }
}
