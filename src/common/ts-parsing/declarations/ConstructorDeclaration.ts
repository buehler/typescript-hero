import { NotImplementedYetError } from '../../errors';
import { nodeRange } from '../Node';
import { CallableDeclaration } from './Declaration';
import { ParameterDeclaration } from './ParameterDeclaration';
import { VariableDeclaration } from './VariableDeclaration';
import { CompletionItemKind, Range, TextDocument } from 'vscode-languageserver-types';

/**
 * Constructor declaration that is contained in a class.
 * 
 * @export
 * @class ConstructorDeclaration
 * @implements {CallableDeclaration}
 */
export class ConstructorDeclaration implements CallableDeclaration {
    public readonly _type: string = 'ConstructorDeclaration';

    public parameters: ParameterDeclaration[] = [];
    public variables: VariableDeclaration[] = [];

    public get itemKind(): CompletionItemKind {
        return CompletionItemKind.Constructor;
    }

    public get intellisenseSortKey(): string {
        return `0_${this.name}`;
    }

    constructor(
        public name: string,
        public start?: number,
        public end?: number
    ) { }

    /**
     * Calculates the document range of the node in the given document.
     * 
     * @param {TextDocument} document
     * @returns {Range}
     * 
     * @memberOf ConstructorDeclaration
     */
    public getRange(document: TextDocument): Range {
        return nodeRange(document, this.start, this.end);
    }

    /**
     * Generates typescript code out of the actual import.
     * 
     * @returns {string}
     * 
     * @memberOf ConstructorDeclaration
     */
    public generateTypescript(): string {
        throw new NotImplementedYetError();
    }
}
