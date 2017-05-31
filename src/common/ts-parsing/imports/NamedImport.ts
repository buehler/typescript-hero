import { GenerationOptions } from '../../ts-generation';
import { SymbolSpecifier } from '../SymbolSpecifier';
import { Import } from './Import';
import { Serializable } from 'ts-json-serializer';

/**
 * Basic typescript import (ES6 style). Does contain multiple symbols of a file and converts
 * itself to a multiline import if the threshold is reached.
 * (i.e. import {Foobar} from ...).
 * 
 * @export
 * @class NamedImport
 * @implements {Import}
 */
@Serializable({
    factory: (json) => {
        const obj = new NamedImport(json.libraryName, json.start, json.end);
        obj.specifiers = json.specifiers;
        return obj;
    },
})
export class NamedImport implements Import {
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
     * @memberof NamedImport
     */
    public generateTypescript(options: GenerationOptions): string {
        const { eol, stringQuoteStyle, spaceBraces, multiLineWrapThreshold } = options;
        const space = spaceBraces ? ' ' : '';
        const specifiers = this.specifiers.sort(this.specifierSort).map(o => o.generateTypescript()).join(', ');
        const lib = this.libraryName;

        const importString =
            `import {${space}${specifiers}${space}} from ${stringQuoteStyle}${lib}${stringQuoteStyle}${eol}\n`;
        if (importString.length > multiLineWrapThreshold) {
            return this.toMultiLineImport(options);
        }
        return importString;
    }

    /**
     * Clone the current import object.
     * 
     * @returns {NamedImport}
     * 
     * @memberof NamedImport
     */
    public clone(): NamedImport {
        const clone = new NamedImport(this.libraryName, this.start, this.end);
        clone.specifiers = this.specifiers.map(o => o.clone());
        return clone;
    }

    /**
     * Converts the named import into a multiline import.
     * 
     * @param {GenerationOptions} {eol, stringQuoteStyle, tabSize}
     * @returns {string}
     * 
     * @memberof NamedImport
     */
    public toMultiLineImport({ eol, stringQuoteStyle, tabSize }: GenerationOptions): string {
        const spacings = Array(tabSize + 1).join(' ');
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
     * @memberof NamedImport
     */
    private specifierSort(i1: SymbolSpecifier, i2: SymbolSpecifier): number {
        const strA = i1.specifier.toLowerCase();
        const strB = i2.specifier.toLowerCase();

        if (strA < strB) {
            return -1;
        } else if (strA > strB) {
            return 1;
        }
        return 0;
    }
}
