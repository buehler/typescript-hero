/**
 * Resolve specifier that is contained in named imports and exports.
 * Contains the specifier of the symbol and a possible alias.
 * 
 * @export
 * @class TsResolveSpecifier
 */
export class TsResolveSpecifier {
    constructor(public specifier: string, public alias?: string) { }

    public toImport(): string {
        return `${this.specifier}${this.alias ? ` as ${this.alias}` : ''}`;
    }
}
