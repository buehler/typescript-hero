import { Clonable } from './Clonable';
/**
 * Resolve specifier that is contained in named imports and exports.
 * Contains the specifier of the symbol and a possible alias.
 * 
 * @export
 * @class TsResolveSpecifier
 */
export class TsResolveSpecifier implements Clonable {
    constructor(public specifier: string, public alias?: string) { }

    /**
     * Transform the current object to TypeScript code.
     * 
     * @returns {string}
     * 
     * @memberOf TsResolveSpecifier
     */
    public toImport(): string {
        return `${this.specifier}${this.alias ? ` as ${this.alias}` : ''}`;
    }

    /**
     * Clones the current resolve specifier and returns a new instance with the same properties.
     * 
     * @returns {TsResolveSpecifier}
     * 
     * @memberOf TsResolveSpecifier
     */
    public clone(): TsResolveSpecifier {
        return new TsResolveSpecifier(this.specifier, this.alias);
    }
}
