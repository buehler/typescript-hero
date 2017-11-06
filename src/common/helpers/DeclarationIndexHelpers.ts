import { existsSync } from 'fs';
import { join, normalize, parse, relative } from 'path';
import {
    DeclarationInfo,
    DefaultDeclaration,
    ExternalModuleImport,
    Import,
    NamedImport,
    NamespaceImport,
} from 'typescript-parser';
import { toPosix } from 'typescript-parser/utilities/PathHelpers';
import { RelativePattern, Uri, workspace, WorkspaceFolder } from 'vscode';

import { ExtensionConfig } from '../config';

/**
 * Calculates a list of declarationInfos filtered by the already imported ones in the given document.
 * The result is a list of declarations that are not already imported by the document.
 *
 * @export
 * @param {ResolveIndex} resolveIndex
 * @param {string} documentPath
 * @param {TsImport[]} imports
 * @param {string} [rootPath]
 * @returns {DeclarationInfo[]}
 */
export function getDeclarationsFilteredByImports(
    declarationInfos: DeclarationInfo[],
    documentPath: string,
    imports: Import[],
    rootPath?: string,
): DeclarationInfo[] {
    let declarations = declarationInfos;

    for (const tsImport of imports) {
        const importedLib = getAbsolutLibraryName(tsImport.libraryName, documentPath, rootPath);

        if (tsImport instanceof NamedImport) {
            declarations = declarations.filter(
                d => d.from !== importedLib ||
                    !tsImport.specifiers.some(s => s.specifier === d.declaration.name),
            );
            if (tsImport.defaultAlias) {
                declarations = declarations.filter(
                    d => !(tsImport.defaultAlias && d.declaration instanceof DefaultDeclaration && d.from === importedLib),
                );
            }
        } else if (tsImport instanceof NamespaceImport || tsImport instanceof ExternalModuleImport) {
            declarations = declarations.filter(o => o.from !== tsImport.libraryName);
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
 * @param {string} [rootPath] Root path of the workspace
 * @returns {string} Absolut path from the workspace root to the desired library
 */
export function getAbsolutLibraryName(library: string, actualFilePath: string, rootPath?: string): string {
    if (!library.startsWith('.') || !rootPath) {
        return library;
    }
    return '/' + toPosix(relative(
        rootPath,
        normalize(join(parse(actualFilePath).dir, library)),
    )).replace(/\/$/, '');
}

/**
 * Returns the relative path to a specific library.
 * If the library is a node module or a typings module, the name
 * is returned. If the "lib" is in the local workspace, then the
 * relative path from the actual file is returned.
 *
 * @param {string} library Name of the library
 * @param {string} actualFilePath Filepath of the actually open file
 * @param {string} [rootPath] Root path of the workspace
 * @returns {string} Relative path from the actual file to the library
 */
export function getRelativeLibraryName(library: string, actualFilePath: string, rootPath?: string): string {
    if (!library.startsWith('/') || !rootPath) {
        return library;
    }

    const actualDir = parse('/' + relative(rootPath, actualFilePath)).dir;
    let relativePath = relative(actualDir, library);

    if (!relativePath.startsWith('.')) {
        relativePath = './' + relativePath;
    } else if (relativePath === '..') {
        relativePath += '/';
    }
    return toPosix(relativePath);
}

/**
 * This function searches for files in a specific workspace folder. The files are relative to the given
 * workspace folder and the searched type is determined by the configuration of the extension (TS, JS or Both mode).
 *
 * If a node_modules folder is present, but NO package.json, the node_modules are ignored completely.
 * (For performance and memory reasons)
 *
 * @export
 * @param {ExtensionConfig} config
 * @param {WorkspaceFolder} workspaceFolder
 * @returns {Promise<string[]>}
 */
export async function findFiles(config: ExtensionConfig, workspaceFolder: WorkspaceFolder): Promise<string[]> {
    const workspaceExcludes = [
        ...config.resolver.ignorePatterns,
        'node_modules/**/*',
        'typings/**/*',
    ];
    const searches: PromiseLike<Uri[]>[] = [
        workspace.findFiles(
            new RelativePattern(workspaceFolder, `{${config.resolver.resolverModeFileGlobs.join(',')}}`),
            new RelativePattern(workspaceFolder, `{${workspaceExcludes.join(',')}}`),
        ),
    ];

    // TODO: check the package json and index javascript file in node_modules (?)

    let globs: string[] = ['typings/**/*.d.ts'];
    let ignores: string[] = config.resolver.ignorePatterns;
    const rootPath = workspaceFolder.uri.fsPath;
    const hasPackageJson = existsSync(join(rootPath, 'package.json'));

    if (rootPath && hasPackageJson) {
        const packageJson = require(join(rootPath, 'package.json'));
        for (const folder of ['dependencies', 'devDependencies']) {
            if (packageJson[folder]) {
                globs = globs.concat(
                    Object.keys(packageJson[folder]).map(o => `node_modules/${o}/**/*.d.ts`),
                );
                ignores = ignores.concat(
                    Object.keys(packageJson[folder]).map(o => `node_modules/${o}/node_modules/**/*`),
                );
            }
        }
    } else {
        ignores.push('node_modules/**/*');
    }

    searches.push(
        workspace.findFiles(
            new RelativePattern(workspaceFolder, `{${globs.join(',')}}`),
            new RelativePattern(workspaceFolder, `{${ignores.join(',')}}`),
        ),
    );

    const uris = await Promise.all(searches);
    return uris
        .reduce((all, cur) => all.concat(cur), [])
        .map(o => o.fsPath);
}
