import {TypescriptSymbol} from './TypescriptSymbol';

export class ImportSymbol {
    constructor(public element: string, public symbol: TypescriptSymbol) { }
}
