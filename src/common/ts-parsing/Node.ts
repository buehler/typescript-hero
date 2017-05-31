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
     * @memberof Node
     */
    start?: number;

    /**
     * The ending character of the node in the document.
     * 
     * @type {number}
     * @memberof Node
     */
    end?: number;
}
