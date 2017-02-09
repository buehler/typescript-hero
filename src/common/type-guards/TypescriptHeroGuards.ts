import { CallableDeclaration } from '../ts-parsing/declarations';

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
