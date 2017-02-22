import { Position, Range } from 'vscode-languageserver-types';

export type DocumentLike = {
    /**
     * Converts a zero-based offset to a position.
     *
     * @param offset A zero-based offset.
     * @return A valid [position](#Position).
     */
    positionAt(offset: number): Position;
};

/**
 * Returns the range of a node in the given document. If start or end is undefined,
 * the document head (aka first line) is returned as range.
 * 
 * @export
 * @param {DocumentLike} document
 * @param {number} [start]
 * @param {number} [end]
 * @returns {Range}
 */
export function nodeRange(document: DocumentLike, start?: number, end?: number): Range {
    return start !== undefined && end !== undefined ?
        Range.create(document.positionAt(start), document.positionAt(end)) :
        Range.create(Position.create(0, 0), Position.create(0, 0));
}

/**
 * Base class for all nodes / declarations / imports / etc. in the extension.
 * Contains basic information about the node.
 * 
 * @export
 * @interface Node
 */
export interface Node {
    /**
     * The starting character of the node in the document.
     * 
     * @type {number}
     * @memberOf Node
     */
    start?: number;

    /**
     * The ending character of the node in the document.
     * 
     * @type {number}
     * @memberOf Node
     */
    end?: number;
}
