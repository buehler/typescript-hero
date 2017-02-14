import { GenerationOptions } from '../../ts-generation';
import { AliasedImport, importRange } from './Import';
import { Range, TextDocument } from 'vscode-languageserver-types';

/**
 * Import that imports a whole namespace (i.e. import * as foobar from 'foobar';).
 * 
 * @export
 * @class TsNamespaceImport
 * @implements {AliasedImport}
 */
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
     * @memberOf NamespaceImport
     */
    public generateTypescript({stringQuoteStyle, eol}: GenerationOptions): string {
        return `import * as ${this.alias} from ${stringQuoteStyle}${this.libraryName}${stringQuoteStyle}${eol}\n`;
    }

    /**
     * Calculates the document range of the node in the given document.
     * 
     * @param {TextDocument} document
     * @returns {Range}
     * 
     * @memberOf NamespaceImport
     */
    public getRange(document: TextDocument): Range {
        return importRange(document, this.start, this.end);
    }

    /**
     * Clone the current import object.
     * 
     * @returns {NamespaceImport}
     * 
     * @memberOf NamespaceImport
     */
    public clone(): NamespaceImport {
        return new NamespaceImport(this.libraryName, this.alias, this.start, this.end);
    }
}
