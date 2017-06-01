import { SymbolSpecifier } from '../../common/ts-parsing';
import { Import } from '../../common/ts-parsing/imports';

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
