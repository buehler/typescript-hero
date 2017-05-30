import { Serializable } from 'ts-json-serializer';
import { Generatable } from '../ts-generation';
import { Clonable } from '../utilities';

/**
 * Class for symbols that are contained in a named import or export or anywhere. Basically an aliased object.
 * (i.e. import {SYMBOL} from '...').
 * 
 * @export
 * @class SymbolSpecifier
 * @implements {Clonable}
 */
@Serializable({ factory: json => new SymbolSpecifier(json.specifier, json.alias) })
export class SymbolSpecifier implements Clonable, Generatable {
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
     * @returns {SymbolSpecifier}
     * 
     * @memberOf SymbolSpecifier
     */
    public clone(): SymbolSpecifier {
        return new SymbolSpecifier(this.specifier, this.alias);
    }
}
