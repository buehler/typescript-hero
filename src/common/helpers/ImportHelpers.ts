import { ImportLocation } from '../ts-generation';
import { TextEditor } from 'vscode';
import { Position } from 'vscode-languageserver-types';

/**
 * Calculate the position, where a new import should be inserted.
 * Does respect the "use strict" string as first line of a document.
 * 
 * @export
 * @param {ImportLocation} location
 * @param {TextEditor} editor
 * @returns {Position}
 */
export function getImportInsertPosition(location: ImportLocation, editor: TextEditor): Position {
    if (!editor) {
        return Position.create(0, 0);
    }
    if (location === ImportLocation.TopOfFile) {
        return editor.document.lineAt(0).text.match(/use strict/) ? Position.create(1, 0) : Position.create(0, 0);
    }
    return Position.create(editor.selection.active.line, 0);
}
