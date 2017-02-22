import { DocumentLike, nodeRange } from '../Node';
import { Export } from './Export';
import { Serializable } from 'ts-json-serializer';
import { Range } from 'vscode-languageserver-types';

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
     * @param {DocumentLike} document
     * @returns {Range}
     * 
     * @memberOf StringImport
     */
    public getRange(document: DocumentLike): Range {
        return nodeRange(document, this.start, this.end);
    }
}
