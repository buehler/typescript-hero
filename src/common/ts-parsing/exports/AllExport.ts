import { nodeRange } from '../Node';
import { Export } from './Export';
import { Serializable } from 'ts-json-serializer';
import { Range, TextDocument } from 'vscode-languageserver-types';

/**
 * Declares an all export (i.e. export * from ...).
 * 
 * @export
 * @class AllExport
 * @implements {Export}
 */
@Serializable({ factory: json => new AllExport(json.start, json.end, json.from) })
export class AllExport implements Export {
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
