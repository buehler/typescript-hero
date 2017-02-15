import { NotImplementedYetError } from '../../errors';
import { nodeRange } from '../Node';
import { ExportableDeclaration } from './Declaration';
import { Serializable } from 'ts-json-serializer';
import { CompletionItemKind, Range, TextDocument } from 'vscode-languageserver-types';

/**
 * Alias declaration that can be exported. Is used to defined types.
 * (e.g. type Foobar = { name: string };)
 * 
 * @export
 * @class TypeAliasDeclaration
 * @implements {ExportableDeclaration}
 */
@Serializable({
    factory: json => new TypeAliasDeclaration(
        json.name, json.isExported, json.start, json.end
    )
})
export class TypeAliasDeclaration implements ExportableDeclaration {
    public get itemKind(): CompletionItemKind {
        return CompletionItemKind.Keyword;
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
     * @memberOf TypeAliasDeclaration
     */
    public getRange(document: TextDocument): Range {
        return nodeRange(document, this.start, this.end);
    }

    /**
     * Generates typescript code out of the actual import.
     * 
     * @returns {string}
     * 
     * @memberOf TypeAliasDeclaration
     */
    public generateTypescript(): string {
        throw new NotImplementedYetError();
    }
}
