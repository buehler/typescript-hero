import { basename, join, normalize, parse, relative } from 'path';
import { ScriptKind } from 'typescript';
import {
  ClassDeclaration,
  ConstructorDeclaration,
  Declaration,
  DeclarationInfo,
  DefaultDeclaration,
  EnumDeclaration,
  ExternalModuleImport,
  FunctionDeclaration,
  GetterDeclaration,
  Import,
  InterfaceDeclaration,
  MethodDeclaration,
  ModuleDeclaration,
  NamedImport,
  NamespaceImport,
  ParameterDeclaration,
  PropertyDeclaration,
  SetterDeclaration,
  StringImport,
  SymbolSpecifier,
  TypeAliasDeclaration,
  VariableDeclaration,
} from 'typescript-parser';
import { toPosix } from 'typescript-parser/utilities/PathHelpers';
import { CompletionItemKind, Position, TextEditor } from 'vscode';

import { ImportGroup, RegexImportGroup } from '../imports/import-grouping';

/**
 * String-Sort function.
 *
 * @export
 * @param {string} strA
 * @param {string} strB
 * @param {('asc' | 'desc')} [order='asc']
 * @returns {number}
 */
export function stringSort(strA: string, strB: string, order: 'asc' | 'desc' = 'asc'): number {
  let result: number = 0;
  if (strA < strB) {
    result = -1;
  } else if (strA > strB) {
    result = 1;
  }
  if (order === 'desc') {
    result *= -1;
  }
  return result;
}

/**
* Orders import groups by matching precedence (regex first).  This is used internally by
* `ImportManager` when assigning imports to groups, so regex groups can appear later than
* keyword groups yet capture relevant imports nonetheless.
*
* @export
* @param {ImportGroup[]} importGroups The original import groups (as per extension configuration)
* @returns {ImportGroup[]} The same list, with Regex import groups appearing first.
*/
export function importGroupSortForPrecedence(importGroups: ImportGroup[]): ImportGroup[] {
  const regexGroups: ImportGroup[] = [];
  const otherGroups: ImportGroup[] = [];
  for (const ig of importGroups) {
    (ig instanceof RegexImportGroup ? regexGroups : otherGroups).push(ig);
  }
  return regexGroups.concat(otherGroups);
}

/**
* Locale-sensitive ("Human-compatible") String-Sort function.
*
* @param {string} strA
* @param {string} strB
* @param {('asc' | 'desc')} [order='asc']
* @returns {number}
*/
function localeStringSort(strA: string, strB: string, order: 'asc' | 'desc' = 'asc'): number {
  let result: number = strA.localeCompare(strB);
  if (order === 'desc') {
    result *= -1;
  }
  return result;
}

/**
* Order imports by library name.
*
* @export
* @param {Import} i1
* @param {Import} i2
* @param {('asc' | 'desc')} [order='asc']
* @returns {number}
*/
export function importSort(i1: Import, i2: Import, order: 'asc' | 'desc' = 'asc'): number {
  const strA = i1.libraryName.toLowerCase();
  const strB = i2.libraryName.toLowerCase();

  return stringSort(strA, strB, order);
}

/**
* Order imports by first specifier name. Does not re-sort specifiers internally:
* assumes they were sorted AOT (which happens in `ImportManager#organizeImports`,
* indeed).
*
* @export
* @param {Import} i1
* @param {Import} i2
* @param {('asc' | 'desc')} [order='asc']
* @returns {number}
*/
export function importSortByFirstSpecifier(i1: Import, i2: Import, order: 'asc' | 'desc' = 'asc'): number {
  const strA = getImportFirstSpecifier(i1);
  const strB = getImportFirstSpecifier(i2);

  return localeStringSort(strA, strB, order);
}

/**
* Computes the first specifier/alias of an import, falling back ot its
* module path (for StringImports, basically). Does not re-sort specifiers
* internally: assumes they were sorted AOT (which happens in
* `ImportManager#organizeImports`, indeed).
*
* @param {Import} imp
* @returns {String}
*/
function getImportFirstSpecifier(imp: Import): string {
  if (imp instanceof NamespaceImport || imp instanceof ExternalModuleImport) {
    return imp.alias;
  }

  if (imp instanceof StringImport) {
    return basename(imp.libraryName);
  }

  if (imp instanceof NamedImport) {
    const namedSpecifiers = (imp as NamedImport).specifiers
      .map(s => s.alias || s.specifier)
      .filter(Boolean);
    const marker = namedSpecifiers[0] || imp.defaultAlias;
    if (marker) {
      return marker;
    }
  }

  return basename(imp.libraryName);
}

/**
* Order specifiers by name.
*
* @export
* @param {SymbolSpecifier} i1
* @param {SymbolSpecifier} i2
* @returns {number}
*/
export function specifierSort(i1: SymbolSpecifier, i2: SymbolSpecifier): number {
  return stringSort(i1.specifier, i2.specifier);
}

/**
 * Returns the item kind for a given declaration.
 *
 * @export
 * @param {Declaration} declaration
 * @returns {CompletionItemKind}
 */
export function getItemKind(declaration: Declaration): CompletionItemKind {
  switch (true) {
    case declaration instanceof ClassDeclaration:
      return CompletionItemKind.Class;
    case declaration instanceof ConstructorDeclaration:
      return CompletionItemKind.Constructor;
    case declaration instanceof DefaultDeclaration:
      return CompletionItemKind.File;
    case declaration instanceof EnumDeclaration:
      return CompletionItemKind.Enum;
    case declaration instanceof FunctionDeclaration:
      return CompletionItemKind.Function;
    case declaration instanceof InterfaceDeclaration:
      return CompletionItemKind.Interface;
    case declaration instanceof MethodDeclaration:
      return CompletionItemKind.Method;
    case declaration instanceof ModuleDeclaration:
      return CompletionItemKind.Module;
    case declaration instanceof ParameterDeclaration:
      return CompletionItemKind.Variable;
    case declaration instanceof PropertyDeclaration:
      return CompletionItemKind.Property;
    case declaration instanceof TypeAliasDeclaration:
      return CompletionItemKind.TypeParameter;
    case declaration instanceof VariableDeclaration:
      const variable = declaration as VariableDeclaration;
      return variable.isConst ?
        CompletionItemKind.Constant :
        CompletionItemKind.Variable;
    case declaration instanceof GetterDeclaration:
    case declaration instanceof SetterDeclaration:
      return CompletionItemKind.Method;
    default:
      return CompletionItemKind.Reference;
  }
}

/**
 * Calculates the scriptkind for the typescript parser based on filepath.
 *
 * @export
 * @param {string} filePath
 * @returns {ScriptKind}
 */
export function getScriptKind(filePath: string | undefined): ScriptKind {
  if (!filePath) {
    return ScriptKind.TS;
  }
  const parsed = parse(filePath);
  switch (parsed.ext) {
    case '.ts':
      return ScriptKind.TS;
    case '.tsx':
      return ScriptKind.TSX;
    case '.js':
      return ScriptKind.JS;
    case '.jsx':
      return ScriptKind.JSX;
    default:
      return ScriptKind.Unknown;
  }
}

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
