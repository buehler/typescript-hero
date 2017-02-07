import { Generatable } from '../../ts-generation';
import { Clonable } from '../../utilities';
import { Node } from '../Node';
import { Position, Range, TextDocument } from 'vscode-languageserver-types';

/**
 * Function that calculates the range object for an import.
 * 
 * @export
 * @param {TextDocument} document
 * @param {number} [start]
 * @param {number} [end]
 * @returns {Range}
 */
export function importRange(document: TextDocument, start?: number, end?: number): Range {
    return start !== undefined && end !== undefined ?
        Range.create(
            Position.create(document.positionAt(start).line, 0),
            Position.create(document.positionAt(end + 1).line, 0)
        ) :
        Range.create(Position.create(0, 0), Position.create(0, 0));
}

/**
 * Basic import interface. Defines an import in a document.
 * If no start and end points are given, the import is considered "new".
 * 
 * @export
 * @interface Import
 */
export interface Import extends Clonable, Node, Generatable {
    /**
     * Indicates if the given import is "new" or a parsed one.
     * 
     * @type {boolean}
     * @memberOf Import
     */
    readonly isNew: boolean;

    /**
     * The library name of the given import (This actually is the part after the import statement).
     *
     * @example "express"
     *
     * @type {string}
     * @memberOf Import
     */
    libraryName: string;
}

/**
 * Basic interface for aliased imports. Defines an alias for namespace imports and other aliased imports.
 * 
 * @export
 * @interface AliasedImport
 * @extends {Import}
 */
export interface AliasedImport extends Import {
    /**
     * Alias for the given import. E.g. for a "* as ..." import.
     * 
     * @type {string}
     * @memberOf AliasedImport
     */
    alias: string;
}
