import { GenerationOptions } from '../../ts-generation';
import { SymbolSpecifier } from '../SymbolSpecifier';
import { Import, importRange } from './Import';
import { Range, TextDocument } from 'vscode-languageserver-types';

/**
 * Basic typescript import (ES6 style). Does contain multiple symbols of a file and converts
 * itself to a multiline import if the threshold is reached.
 * (i.e. import {Foobar} from ...).
 * 
 * @export
 * @class NamedImport
 * @implements {Import}
 */
export class NamedImport implements Import {
    public readonly _type: string = 'NamedImport';
    public specifiers: SymbolSpecifier[] = [];

    public get isNew(): boolean {
        return this.start !== undefined && this.end !== undefined;
    }

    constructor(public libraryName: string, public start?: number, public end?: number) { }

    /**
     * Generates typescript code out of the actual import.
     * 
     * @param {GenerationOptions} options
     * @returns {string}
     * 
     * @memberOf NamedImport
     */
    public generateTypescript(options: GenerationOptions): string {
        let {eol, stringQuoteStyle, spaceBraces, multiLineWrapThreshold} = options,
            space = spaceBraces ? ' ' : '',
            specifiers = this.specifiers.sort(this.specifierSort).map(o => o.generateTypescript()).join(', '),
            lib = this.libraryName;

        let importString =
            `import {${space}${specifiers}${space}} from ${stringQuoteStyle}${lib}${stringQuoteStyle}${eol}\n`;
        if (importString.length > multiLineWrapThreshold) {
            return this.toMultiLineImport(options);
        }
        return importString;
    }

    /**
     * Calculates the document range of the node in the given document.
     * 
     * @param {TextDocument} document
     * @returns {Range}
     * 
     * @memberOf NamedImport
     */
    public getRange(document: TextDocument): Range {
        return importRange(document, this.start, this.end);
    }

    /**
     * Clone the current import object.
     * 
     * @returns {NamedImport}
     * 
     * @memberOf NamedImport
     */
    public clone(): NamedImport {
        let clone = new NamedImport(this.libraryName, this.start, this.end);
        clone.specifiers = this.specifiers.map(o => o.clone());
        return clone;
    }

    /**
     * Converts the named import into a multiline import.
     * 
     * @param {GenerationOptions} {eol, stringQuoteStyle, tabSize}
     * @returns {string}
     * 
     * @memberOf NamedImport
     */
    public toMultiLineImport({eol, stringQuoteStyle, tabSize}: GenerationOptions): string {
        let spacings = Array(tabSize + 1).join(' ');
        return `import {
${this.specifiers.sort(this.specifierSort).map(o => `${spacings}${o.generateTypescript()}`).join(',\n')}
} from ${stringQuoteStyle}${this.libraryName}${stringQuoteStyle}${eol}\n`;
    }

    /**
     * Sorts the specifiers by name. Sorting function that is passed to [].sort().
     * 
     * @private
     * @param {SymbolSpecifier} i1
     * @param {SymbolSpecifier} i2
     * @returns {number} - Sort index
     * 
     * @memberOf NamedImport
     */
    private specifierSort(i1: SymbolSpecifier, i2: SymbolSpecifier): number {
        let strA = i1.specifier.toLowerCase(),
            strB = i2.specifier.toLowerCase();

        if (strA < strB) {
            return -1;
        } else if (strA > strB) {
            return 1;
        }
        return 0;
    }
}
