import { GenerationOptions } from '../../ts-generation';
import { AliasedImport, importRange } from './Import';
import { Range, TextDocument } from 'vscode-languageserver-types';

/**
 * Alternative to the namespace import. Can be used by various libraries.
 * (i.e. import foobar = require('foobar')).
 * 
 * @export
 * @class ExternalModuleImport
 * @implements {AliasedImport}
 */
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
     * Calculates the document range of the node in the given document.
     * 
     * @param {TextDocument} document
     * @returns {Range}
     * 
     * @memberOf ExternalModuleImport
     */
    public getRange(document: TextDocument): Range {
        return importRange(document, this.start, this.end);
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
