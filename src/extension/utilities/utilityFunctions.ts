import { ImportGroup, RegexImportGroup } from '../import-grouping';
import { basename } from 'path';
import {
    ClassDeclaration,
    ConstructorDeclaration,
    Declaration,
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
import { CompletionItemKind } from 'vscode';

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
