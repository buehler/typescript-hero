import { Position, TextEditor } from 'vscode';

/**
 * Calculate the position, where a new import should be inserted.
 * Does respect the "use strict" string as first line of a document.
 * 
 * @export
 * @param {TextEditor} editor
 * @returns {Position}
 */
export function getImportInsertPosition(editor: TextEditor): Position {
    if (!editor) {
        return new Position(0, 0);
    }
    return editor.document.lineAt(0).text.match(/use strict/) ? new Position(1, 0) : new Position(0, 0);
}
