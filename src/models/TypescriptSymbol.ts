export enum SymbolType {
    Node,
    Typings,
    Local
}

export class TypescriptSymbol {
    public exports: string[] = [];

    public get alias(): string {
        return this.library
            .split('-')
            .map((o, ix) => ix === 0 ? this.lowerCasePart(o) : this.upperCasePart(o))
            .join('');
    }

    constructor(public library: string, public path: string, public type: SymbolType) { }

    private lowerCasePart(s: string): string {
        if (!s.length) {
            return '';
        }
        return `${s.charAt(0).toLowerCase()}${s.substring(1)}`;
    }

    private upperCasePart(s: string): string {
        if (!s.length) {
            return '';
        }
        return `${s.charAt(0).toUpperCase()}${s.substring(1)}`;
    }
}
