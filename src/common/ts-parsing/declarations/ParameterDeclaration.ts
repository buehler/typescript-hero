import { nodeRange } from '../Node';
import { TypedDeclaration } from './Declaration';
import { CompletionItemKind, Range, TextDocument } from 'vscode-languageserver-types';

/**
 * Parameter declaration. Is contained in a method or function delaration since a parameter can not be exported
 * by itself.
 * 
 * @export
 * @class ParameterDeclaration
 * @implements {TypedDeclaration}
 */
export class ParameterDeclaration implements TypedDeclaration {
    public readonly _type: string = 'ParameterDeclaration';

    public get itemKind(): CompletionItemKind {
        return CompletionItemKind.Variable;
    }

    public get intellisenseSortKey(): string {
        return `0_${this.name}`;
    }

    constructor(public name: string, public type: string | undefined, public start?: number, public end?: number) { }

    /**
     * Calculates the document range of the node in the given document.
     * 
     * @param {TextDocument} document
     * @returns {Range}
     * 
     * @memberOf ParameterDeclaration
     */
    public getRange(document: TextDocument): Range {
        return nodeRange(document, this.start, this.end);
    }

    /**
     * Generates typescript code out of the actual import.
     * 
     * @returns {string}
     * 
     * @memberOf ParameterDeclaration
     */
    public generateTypescript(): string {
        return `${this.name}${this.type ? `: ${this.type}` : ''}`;
    }
}
