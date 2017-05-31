import { NotImplementedYetError } from '../../errors';
import { ExportableDeclaration } from './Declaration';
import { Serializable } from 'ts-json-serializer';
import { CompletionItemKind } from 'vscode-languageserver-types';

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
        json.name, json.isExported, json.start, json.end,
    ),
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
        public end?: number,
    ) { }

    /**
     * Generates typescript code out of the actual import.
     * 
     * @returns {string}
     * 
     * @memberof TypeAliasDeclaration
     */
    public generateTypescript(): string {
        throw new NotImplementedYetError();
    }
}
