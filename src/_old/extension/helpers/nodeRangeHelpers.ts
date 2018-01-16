import { Position, Range, TextDocument } from 'vscode';

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
        new Range(document.positionAt(start), document.positionAt(end)) :
        new Range(new Position(0, 0), new Position(0, 0));
}
