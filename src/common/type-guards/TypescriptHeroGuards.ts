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
 * Determines if the given object is a ExportableDeclaration.
 * 
 * @export
 * @param {*} obj
 * @returns {obj is ExportableDeclaration}
 */
export function isExportableDeclaration(obj: any): obj is ExportableDeclaration {
    return obj && Object.keys(obj).indexOf('isExported') >= 0;
}
