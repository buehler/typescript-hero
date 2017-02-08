import { nodeRange } from '../Node';
import { ExportableDeclaration, TypedDeclaration } from './Declaration';
import { CompletionItemKind, Range, TextDocument } from 'vscode-languageserver-types';

/**
 * Variable declaration. Is contained in a method or function, or can be exported.
 * 
 * @export
 * @class VariableDeclaration
 * @implements {ExportableDeclaration}
 * @implements {TypedDeclaration}
 */
export class VariableDeclaration implements ExportableDeclaration, TypedDeclaration {
    public readonly _type: string = 'VariableDeclaration';

    public get itemKind(): CompletionItemKind {
        return CompletionItemKind.Variable;
    }

    public get intellisenseSortKey(): string {
        return `1_${this.name}`;
    }

    constructor(
        public name: string,
        public isExported: boolean,
        public type: string | undefined,
        public start?: number,
        public end?: number
    ) { }

    /**
     * Calculates the document range of the node in the given document.
     * 
     * @param {TextDocument} document
     * @returns {Range}
     * 
     * @memberOf VariableDeclaration
     */
    public getRange(document: TextDocument): Range {
        return nodeRange(document, this.start, this.end);
    }

    /**
     * Generates typescript code out of the actual import.
     * 
     * @returns {string}
     * 
     * @memberOf VariableDeclaration
     */
    public generateTypescript(): string {
        return `${this.name}${this.type ? `: ${this.type}` : ''}`;
    }
}
