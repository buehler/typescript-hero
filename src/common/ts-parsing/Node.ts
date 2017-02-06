import { Range, TextDocument } from 'vscode-languageserver-types';

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
