import { NotImplementedYetError } from '../../errors';
import { DocumentLike, nodeRange } from '../Node';
import { ExportableDeclaration } from './Declaration';
import { Serializable } from 'ts-json-serializer';
import { CompletionItemKind, Range } from 'vscode-languageserver-types';

/**
 * Enum declaration.
 * 
 * @export
 * @class EnumDeclaration
 * @implements {ExportableDeclaration}
 */
@Serializable({
    factory: json => {
        const obj = new EnumDeclaration(json.name, json.isExported, json.start, json.end);
        obj.members = json.members;
        return obj;
    }
})
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
     * @param {DocumentLike} document
     * @returns {Range}
     * 
     * @memberOf EnumDeclaration
     */
    public getRange(document: DocumentLike): Range {
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
