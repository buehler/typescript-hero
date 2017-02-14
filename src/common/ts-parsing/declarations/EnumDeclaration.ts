import { NotImplementedYetError } from '../../errors';
import { nodeRange } from '../Node';
import { ExportableDeclaration } from './Declaration';
import { CompletionItemKind, Range, TextDocument } from 'vscode-languageserver-types';

/**
 * Enum declaration.
 * 
 * @export
 * @class EnumDeclaration
 * @implements {ExportableDeclaration}
 */
export class EnumDeclaration implements ExportableDeclaration {
    public members: string[] = [];

    public get itemKind(): CompletionItemKind {
        return CompletionItemKind.Enum;
    }

    public get intellisenseSortKey(): string {
        return `0_${this.name}`;
    }

    constructor(
        public name: string,
        public isExported: boolean,
        public start?: number,
        public end?: number
    ) { }

    /**
     * Calculates the document range of the node in the given document.
     * 
     * @param {TextDocument} document
     * @returns {Range}
     * 
     * @memberOf EnumDeclaration
     */
    public getRange(document: TextDocument): Range {
        return nodeRange(document, this.start, this.end);
    }

    /**
     * Generates typescript code out of the actual import.
     * 
     * @returns {string}
     * 
     * @memberOf EnumDeclaration
     */
    public generateTypescript(): string {
        throw new NotImplementedYetError();
    }
}
