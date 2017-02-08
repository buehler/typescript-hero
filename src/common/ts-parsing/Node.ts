import { Position, Range, TextDocument } from 'vscode-languageserver-types';

/**
 * Returns the range of a node in the given document. If start or end is undefined,
 * the document head (aka first line) is returned as range.
 * 
 * @export
 * @param {TextDocument} document
 * @param {number} [start]
 * @param {number} [end]
 * @returns {Range}
 */
export function nodeRange(document: TextDocument, start?: number, end?: number): Range {
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
     * A special field to indicate the type that is used to this node. Mainly used for determination of interfaces
     * and recreating objects after serialization / deserialization.
     *
     * @example "DefaultDeclaration"
     * 
     * @type {string}
     * @memberOf Node
     */
    _type: string;

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

    /**
     * Calculates the document range of the node in the given document.
     * 
     * @param {TextDocument} document
     * @returns {Range}
     * 
     * @memberOf Node
     */
    getRange(document: TextDocument): Range;
}
