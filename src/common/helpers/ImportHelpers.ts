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
    const lines = editor.document.getText().split('\n');
    const index = lines.findIndex(line => !line.match(/^\s*(\/\/|\/\*\*|\*\/|\*|['"]use strict['"])/g));
    return new Position(Math.max(0, index), 0);
}
