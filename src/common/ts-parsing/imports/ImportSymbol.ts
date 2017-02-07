import { Generatable } from '../../ts-generation';
import { Clonable } from '../../utilities';

/**
 * Class for symbols that are contained in a named import.
 * (i.e. import {SYMBOL} from '...').
 * 
 * @export
 * @class ImportSymbol
 * @implements {Clonable}
 */
export class ImportSymbol implements Clonable, Generatable {
    constructor(public specifier: string, public alias?: string) { }

    /**
     * Generates typescript code out of the actual import.
     * 
     * @returns {string}
     * 
     * @memberOf DefaultImport
     */
    public generateTypescript(): string {
        return `${this.specifier}${this.alias ? ` as ${this.alias}` : ''}`;
    }

    /**
     * Clones the current resolve specifier and returns a new instance with the same properties.
     * 
     * @returns {ImportSymbol}
     * 
     * @memberOf ImportSymbol
     */
    public clone(): ImportSymbol {
        return new ImportSymbol(this.specifier, this.alias);
    }
}
