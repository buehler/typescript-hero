import { DeclarationInfo, DefaultDeclaration } from '../ts-parsing/declarations';
import { DefaultImport, ExternalModuleImport, Import, NamedImport, NamespaceImport } from '../ts-parsing/imports';
import { join, normalize, parse, relative } from 'path';

/**
 * Calculates a list of declarationInfos filtered by the already imported ones in the given document.
 * The result is a list of declarations that are not already imported by the document.
 * 
 * @export
 * @param {ResolveIndex} resolveIndex
 * @param {string} documentPath
 * @param {string} rootPath
 * @param {TsImport[]} imports
 * @returns {DeclarationInfo[]}
 */
export function getDeclarationsFilteredByImports(
    declarationInfos: DeclarationInfo[],
    documentPath: string,
    rootPath: string,
    imports: Import[]
): DeclarationInfo[] {
    let declarations = declarationInfos;

    for (let tsImport of imports) {
        const importedLib = getAbsolutLibraryName(tsImport.libraryName, documentPath, rootPath);

        if (tsImport instanceof NamedImport) {
            declarations = declarations
                .filter(o => o.from !== importedLib || !(tsImport as NamedImport).specifiers
                    .some(s => s.specifier === o.declaration.name));
        } else if (tsImport instanceof NamespaceImport || tsImport instanceof ExternalModuleImport) {
            declarations = declarations.filter(o => o.from !== tsImport.libraryName);
        } else if (tsImport instanceof DefaultImport) {
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
 * @param {string} library Name of the library
 * @param {string} actualFilePath Filepath of the actually open file
 * @param {string} rootPath Root path of the workspace
 * @returns {string} Absolut path from the workspace root to the desired library
 */
export function getAbsolutLibraryName(library: string, actualFilePath: string, rootPath: string): string {
    if (!library.startsWith('.')) {
        return library;
    }
    return '/' + relative(
        rootPath,
        normalize(join(parse(actualFilePath).dir, library))
    ).replace(/[/]$/g, '');
}

/**
 * Returns the relative path to a specific library.
 * If the library is a node module or a typings module, the name
 * is returned. If the "lib" is in the local workspace, then the
 * relative path from the actual file is returned.
 * 
 * @param {string} library Name of the library
 * @param {string} actualFilePath Filepath of the actually open file
 * @param {string} rootPath Root path of the workspace
 * @returns {string} Relative path from the actual file to the library
 */
export function getRelativeLibraryName(library: string, actualFilePath: string, rootPath: string): string {
    if (!library.startsWith('/')) {
        return library;
    }

    const actualDir = parse('/' + relative(rootPath, actualFilePath)).dir;
    let relativePath = relative(actualDir, library);

    if (!relativePath.startsWith('.')) {
        relativePath = './' + relativePath;
    } else if (relativePath === '..') {
        relativePath += '/';
    }
    return relativePath.replace(/\\/g, '/');
}
