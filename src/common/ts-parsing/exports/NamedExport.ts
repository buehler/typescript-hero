import { DocumentLike, nodeRange } from '../Node';
import { SymbolSpecifier } from '../SymbolSpecifier';
import { Export } from './Export';
import { Serializable } from 'ts-json-serializer';
import { Range } from 'vscode-languageserver-types';

/**
 * Declares a named export (i.e. export { Foobar } from ...).
 * 
 * @export
 * @class NamedExport
 * @implements {Export}
 */
@Serializable({
    factory: json => {
        const obj = new NamedExport(json.start, json.end, json.from);
        obj.specifiers = json.specifiers;
        return obj;
    }
})
export class NamedExport implements Export {
    public specifiers: SymbolSpecifier[];

    constructor(public start: number, public end: number, public from: string) { }

    /**
     * Calculates the document range of the node in the given document.
     * 
     * @param {DocumentLike} document
     * @returns {Range}
     * 
     * @memberOf StringImport
     */
    public getRange(document: DocumentLike): Range {
        return nodeRange(document, this.start, this.end);
    }
}
