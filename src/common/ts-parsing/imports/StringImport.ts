import { GenerationOptions } from '../../ts-generation';
import { Import, importRange } from './Import';
import { Range, TextDocument } from 'vscode-languageserver-types';

/**
 * Simple string import (i.e. import "reflect-metadata";).
 * 
 * @export
 * @class StringImport
 * @implements {Import}
 */
export class StringImport implements Import {
    public readonly _type: string = 'StringImport';

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
    public generateTypescript({stringQuoteStyle, eol}: GenerationOptions): string {
        return `import ${stringQuoteStyle}${this.libraryName}${stringQuoteStyle}${eol}\n`;
    }

    /**
     * Calculates the document range of the node in the given document.
     * 
     * @param {TextDocument} document
     * @returns {Range}
     * 
     * @memberOf StringImport
     */
    public getRange(document: TextDocument): Range {
        return importRange(document, this.start, this.end);
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
