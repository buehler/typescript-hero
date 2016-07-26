export enum SymbolType {
    Node,
    Typings,
    Local
}

export class TypescriptSymbol {
    public exports: string[] = [];

    constructor(public library: string, public path: string, public type: SymbolType){}
}
