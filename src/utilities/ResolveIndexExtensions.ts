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

/**
 * Calculates a list of declarationInfos filtered by the already imported ones in the given document.
 * The result is a list of declarations that are not already imported by the document.
 * 
 * @export
 * @param {ResolveIndex} resolveIndex
 * @param {string} documentPath
 * @param {TsImport[]} imports
 * @returns {DeclarationInfo[]}
 */
export function getDeclarationsFilteredByImports(
    resolveIndex: ResolveIndex,
    documentPath: string,
    imports: TsImport[]
): DeclarationInfo[] {
    let declarations = resolveIndex.declarationInfos;

    for (let tsImport of imports) {
        let importedLib = getAbsolutLibraryName(tsImport.libraryName, documentPath);
        if (tsImport instanceof TsNamedImport) {
            declarations = declarations
                .filter(o => o.from !== importedLib || !(tsImport as TsNamedImport).specifiers
                    .some(s => s.specifier === o.declaration.name));
        } else if (tsImport instanceof TsNamespaceImport || tsImport instanceof TsExternalModuleImport) {
            declarations = declarations.filter(o => o.from !== tsImport.libraryName);
        } else if (tsImport instanceof TsDefaultImport) {
            declarations = declarations
                .filter(o => (!(o.declaration instanceof DefaultDeclaration) || importedLib !== o.from));
        }
    }

    return declarations;
}

/**
 * Returns the absolut workspace specific library path.
 * If the library is a node module or a typings module, the name
 * is returned. If the "lib" is in the local workspace, then the
 * absolut path from the workspace root is returned.
 * 
 * @param {string} library - Name of the library
 * @param {string} actualFilePath - Filepath of the actually open file
 * @returns {string} - Absolut path from the workspace root to the desired library
 */
export function getAbsolutLibraryName(library: string, actualFilePath: string): string {
    if (!library.startsWith('.')) {
        return library;
    }
    let relative = '/' + workspace.asRelativePath(
        normalize(join(parse(actualFilePath).dir, library))
    ).replace(/[/]$/g, '');
    return relative;
}

/**
 * Returns the relative path to a specific library.
 * If the library is a node module or a typings module, the name
 * is returned. If the "lib" is in the local workspace, then the
 * relative path from the actual file is returned.
 * 
 * @param {string} library - Name of the library
 * @param {string} actualFilePath - Filepath of the actually open file
 * @returns {string} - Relative path from the actual file to the library
 */
export function getRelativeLibraryName(library: string, actualFilePath: string): string {
    if (!library.startsWith('/')) {
        return library;
    }
    let actualDir = parse('/' + workspace.asRelativePath(actualFilePath)).dir,
        relativePath = relative(actualDir, library);
    if (!relativePath.startsWith('.')) {
        relativePath = './' + relativePath;
    } else if (relativePath === '..') {
        relativePath += '/';
    }
    relativePath = relativePath.replace(/\\/g, '/');
    return relativePath;
}
