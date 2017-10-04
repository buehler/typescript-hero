import {
    ClassDeclaration,
    ConstructorDeclaration,
    Declaration,
    DefaultDeclaration,
    EnumDeclaration,
    FunctionDeclaration,
    GetterDeclaration,
    Import,
    InterfaceDeclaration,
    MethodDeclaration,
    ModuleDeclaration,
    ParameterDeclaration,
    PropertyDeclaration,
    SetterDeclaration,
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
