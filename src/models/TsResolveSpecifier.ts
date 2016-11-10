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

    public toImport(): string {
        return `${this.specifier}${this.alias ? ` as ${this.alias}` : ''}`;
    }

    public clone(): TsResolveSpecifier {
        return new TsResolveSpecifier(this.specifier, this.alias);
    }
}
