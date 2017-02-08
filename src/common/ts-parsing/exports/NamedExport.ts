import { ImportSymbol } from '../imports';
import { nodeRange } from '../Node';
import { Export } from './Export';
import { Range, TextDocument } from 'vscode-languageserver-types';

/**
 * Declares a named export (i.e. export { Foobar } from ...).
 * 
 * @export
 * @class NamedExport
 * @implements {Export}
 */
export class NamedExport implements Export {
    public readonly _type: string = 'NamedExport';

    public specifiers: ImportSymbol[];

    constructor(public start: number, public end: number, public from: string) { }

    /**
     * Calculates the document range of the node in the given document.
     * 
     * @param {TextDocument} document
     * @returns {Range}
     * 
     * @memberOf StringImport
     */
    public getRange(document: TextDocument): Range {
        return nodeRange(document, this.start, this.end);
    }
}
