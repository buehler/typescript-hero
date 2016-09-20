import {DeclarationInfo, ResolveIndex} from '../caches/ResolveIndex';
import {DefaultDeclaration} from '../models/TsDeclaration';
import {TsDefaultImport, TsExternalModuleImport, TsImport, TsNamedImport, TsNamespaceImport} from '../models/TsImport';
import {join, normalize, parse, relative} from 'path';
import {workspace} from 'vscode';

export function getDeclarationsFilteredByImports(resolveIndex: ResolveIndex, documentPath: string, imports: TsImport[]): DeclarationInfo[] {
    let declarations = resolveIndex.declarationInfos;

    for (let tsImport of imports) {
            let importedLib = getAbsolutLibraryName(tsImport.libraryName, documentPath);
        if (tsImport instanceof TsNamedImport) {
            declarations = declarations.filter(o => o.from !== importedLib || !tsImport.specifiers.some(s => s.specifier === o.declaration.name));
        } else if (tsImport instanceof TsNamespaceImport || tsImport instanceof TsExternalModuleImport) {
            declarations = declarations.filter(o => o.from !== tsImport.libraryName);
        } else if (tsImport instanceof TsDefaultImport) {
            declarations = declarations.filter(o => (!(o.declaration instanceof DefaultDeclaration) || importedLib !== o.from));
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
    let relative = '/' + workspace.asRelativePath(normalize(join(parse(actualFilePath).dir, library))).replace(/[/]$/g, '');
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
