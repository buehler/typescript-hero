import { DeclarationVisibility } from './DeclarationVisibility';
import { Generatable } from '../../ts-generation';
import { Node } from '../Node';
import { ParameterDeclaration } from './ParameterDeclaration';
import { VariableDeclaration } from './VariableDeclaration';
import { CompletionItemKind } from 'vscode-languageserver-types';

/**
 * Basic interface for all declarations. Defines the basic needed information for a typescript declaration.
 * 
 * @export
 * @interface Declaration
 * @extends {Node}
 * @extends {Generatable}
 */
export interface Declaration extends Node, Generatable {
    /**
     * The kind of the item. Used for intellisense / autocompletion. Does render a specific icon.
     * 
     * @type {CompletionItemKind}
     * @memberof Declaration
     */
    readonly itemKind: CompletionItemKind;

    /**
     * The sort key for intellisense. By default, this should be the name of the declaration, but can
     * return a special case to order declarations specifically.
     * 
     * @type {string}
     * @memberof Declaration
     */
    readonly intellisenseSortKey: string;

    /**
     * The name of the declaration.
     * 
     * @type {string}
     * @memberof Declaration
     */
    name: string;
}

/**
 * Interface for all typed declarations. Those declarations contain a type that must be taken care of.
 * (e.g. 'string' or 'number')
 * 
 * @export
 * @interface TypedDeclaration
 * @extends {Declaration}
 */
export interface TypedDeclaration extends Declaration {
    /**
     * The type of the declaration.
     *
     * @type {(string | undefined)}
     * @example "string"
     * @example "Declaration[]"
     * @memberof TypedDeclaration
     */
    type: string | undefined;
}

/**
 * Interface for generic type declarations. Those declarations are able to be used in a generic way.
 * Examples are: classes, interfaces, methods and such.
 * 
 * @export
 * @interface GenericDeclaration
 * @extends {Declaration}
 */
export interface GenericDeclaration extends Declaration {
    /**
     * List of type parameters
     * 
     * @type {(string[] | undefined)}
     * @memberof GenericDeclaration
     *
     * @example
     * ['T', 'TResult', 'TError']
     */
    typeParameters: string[] | undefined;
}

/**
 * Interface for exportable declarations. Does contain information about the export status of a declaration.
 * 
 * @export
 * @interface ExportableDeclaration
 * @extends {Declaration}
 */
export interface ExportableDeclaration extends Declaration {
    /**
     * Indicates if the declaration is exported (i.e. export function ...) or not.
     * 
     * @type {boolean}
     * @memberof ExportableDeclaration
     */
    isExported: boolean;
}

/**
 * Interface for visible declarations. Does contain information about the visibility of the declaration.
 * 
 * @export
 * @interface ScopedDeclaration
 * @extends {Declaration}
 */
export interface ScopedDeclaration extends Declaration {
    /**
     * Defines the visibility scope of the declaration. Can be undefined, in which case there
     * is no visibility given (e.g. methods in interfaces).
     * 
     * @type {(DeclarationVisibility | undefined)}
     * @memberof ScopedDeclaration
     */
    visibility: DeclarationVisibility | undefined;
}

/**
 * Interface for callable declarations. Contains lists for parameters and used variables in the callable
 * definitions.
 * 
 * @export
 * @interface CallableDeclaration
 * @extends {Declaration}
 */
export interface CallableDeclaration extends Declaration {
    /**
     * List of used parameters in the callable node.
     * 
     * @type {ParameterDeclaration[]}
     * @memberof CallableDeclaration
     */
    parameters: ParameterDeclaration[];

    /**
     * List of used variables in the callable node.
     * 
     * @type {VariableDeclaration[]}
     * @memberof CallableDeclaration
     */
    variables: VariableDeclaration[];
}

/**
 * Interface for possible abstract declarations. Contains information if the element is abstract or not.
 * 
 * @export
 * @interface AbstractDeclaration
 * @extends {Declaration}
 */
export interface AbstractDeclaration extends Declaration {
    /**
     * Defines if the declaration is abstract or not.
     * 
     * @type {boolean}
     * @memberof AbstractDeclaration
     */
    isAbstract: boolean;
}
