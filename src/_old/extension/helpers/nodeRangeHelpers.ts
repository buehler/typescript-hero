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

/**
 * Function that calculates the range object for an import.
 * 
 * @export
 * @param {TextDocument} document
 * @param {number} [start]
 * @param {number} [end]
 * @returns {Range}
 */
export function importRange(document: TextDocument, start?: number, end?: number): Range {
    return start !== undefined && end !== undefined ?
        new Range(
            document.lineAt(document.positionAt(start).line).rangeIncludingLineBreak.start,
            document.lineAt(document.positionAt(end).line).rangeIncludingLineBreak.end,
        ) :
        new Range(new Position(0, 0), new Position(0, 0));
}
