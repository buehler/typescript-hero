import { Position, Range, TextDocument } from 'vscode';

/**
 * Base class for all nodes / declarations in the extension.
 * Contains basic information about the node.
 * 
 * @export
 * @abstract
 * @class TsNode
 */
export abstract class TsNode {
    constructor(public start?: number, public end?: number) { }

    /**
     * Calculates the document range of the node in the given document.
     * 
     * @param {TextDocument} document
     * @returns {Range}
     * 
     * @memberOf TsNode
     */
    public getRange(document: TextDocument): Range {
        return this.start !== undefined && this.end !== undefined ?
            new Range(document.positionAt(this.start), document.positionAt(this.end)) :
            new Range(new Position(0, 0), new Position(0, 0));
    }
}
