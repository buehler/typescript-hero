import { Position, TextEditor } from 'vscode';

const REGEX_IGNORED_LINE = /^\s*(?:\/\/|\/\*\*|\*\/|\*|(['"])use strict\1)/;

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
    const index = lines.findIndex(line => !REGEX_IGNORED_LINE.test(line));
    return new Position(Math.max(0, index), 0);
}
