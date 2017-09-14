import { Position, TextEditor } from 'vscode';

/**
 * Calculate the position, where a new import should be inserted.
 * Does respect the "use strict" string as first line of a document.
 * 
 * @export
 * @param {TextEditor | undefined} editor
 * @returns {Position}
 */
export function getImportInsertPosition(editor: TextEditor | undefined): Position {
    if (!editor) {
        return new Position(0, 0);
    }
    if (editor.document.lineAt(0).text.trim().match(/^\/\//)) {
        let i = 1;
        while (editor.document.lineAt(i).text.trim().match(/^\/\//)) i += 1;
        return new Position(i, 0);
    } else if (editor.document.lineAt(0).text.trim().match(/\/\*/)) {
        let i = 1;
        while (!editor.document.lineAt(i).text.match(/\*\//)) i += 1;
        i += 1;
        return new Position(i, 0);
    } else if (editor.document.lineAt(0).text.trim().match(/use strict/)) {
        return new Position(1, 0);
    }
    return new Position(0, 0);
}