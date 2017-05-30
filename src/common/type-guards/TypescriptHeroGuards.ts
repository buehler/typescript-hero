import { AliasedImport } from '../ts-parsing/imports';
import { CallableDeclaration, ExportableDeclaration } from '../ts-parsing/declarations';

/**
 * Determines if the given object is a CallableDeclaration.
 * 
 * @export
 * @param {*} obj
 * @returns {obj is CallableDeclaration}
 */
export function isCallableDeclaration(obj: any): obj is CallableDeclaration {
    return obj && obj.parameters && obj.variables;
}

/**
 * Determines if the given object is an ExportableDeclaration.
 * 
 * @export
 * @param {*} obj
 * @returns {obj is ExportableDeclaration}
 */
export function isExportableDeclaration(obj: any): obj is ExportableDeclaration {
    return obj && Object.keys(obj).indexOf('isExported') >= 0;
}

/**
 * Determines if the given object is an AliasedImport.
 * 
 * @export
 * @param {*} obj
 * @returns {obj is AliasedImport}
 */
export function isAliasedImport(obj: any): obj is AliasedImport {
    return obj && Object.keys(obj).indexOf('alias') >= 0;
}
