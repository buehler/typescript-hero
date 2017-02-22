import { NotImplementedYetError } from '../../errors';
import { DocumentLike, nodeRange } from '../Node';
import { Resource } from '../resources';
import { Declaration, ExportableDeclaration } from './Declaration';
import { Serializable } from 'ts-json-serializer';
import { CompletionItemKind, Range } from 'vscode-languageserver-types';

/**
 * Default declaration. Is used when a file exports something as its default.
 * Primary use is to ask the user about a name for the default export.
 * Is kind of an abstract declaration since there is no real declaration.
 * 
 * @export
 * @class DefaultDeclaration
 * @implements {ExportableDeclaration}
 */
@Serializable({
    factory: json => new DefaultDeclaration(
        json.name, json.resource, json.start, json.end
    )
})
export class DefaultDeclaration implements ExportableDeclaration {
    public readonly isExported: boolean = true;

    private exported: Declaration;

    public get exportedDeclaration(): Declaration {
        if (!this.exported) {
            this.exported = this.resource.declarations.find(o => o.name === this.name) !;
        }

        return this.exported;
    }

    public get itemKind(): CompletionItemKind {
        return CompletionItemKind.File;
    }

    public get intellisenseSortKey(): string {
        return `0_${this.name}`;
    }

    constructor(
        public name: string,
        private resource: Resource,
        public start?: number,
        public end?: number
    ) { }

    /**
     * Calculates the document range of the node in the given document.
     * 
     * @param {DocumentLike} document
     * @returns {Range}
     * 
     * @memberOf DefaultDeclaration
     */
    public getRange(document: DocumentLike): Range {
        return nodeRange(document, this.start, this.end);
    }

    /**
     * Generates typescript code out of the actual import.
     * 
     * @returns {string}
     * 
     * @memberOf DefaultDeclaration
     */
    public generateTypescript(): string {
        throw new NotImplementedYetError();
    }
}
