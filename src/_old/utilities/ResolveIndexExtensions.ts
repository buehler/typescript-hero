import { DeclarationInfo, ResolveIndex } from '../caches/ResolveIndex';
import { DefaultDeclaration } from '../models/TsDeclaration';
import {
    TsDefaultImport,
    TsExternalModuleImport,
    TsImport,
    TsNamedImport,
    TsNamespaceImport
} from '../models/TsImport';
import { ImportLocation } from '../models/TsImportOptions';
import { join, normalize, parse, relative } from 'path';
import { Position, TextEditor, workspace } from 'vscode';

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
        return new Position(0, 0);
    }
    if (location === ImportLocation.TopOfFile) {
        return editor.document.lineAt(0).text.match(/use strict/) ? new Position(1, 0) : new Position(0, 0);
    }
    return new Position(editor.selection.active.line, 0);
}
