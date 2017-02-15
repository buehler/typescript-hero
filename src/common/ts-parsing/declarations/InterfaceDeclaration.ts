import { NotImplementedYetError } from '../../errors';
import { nodeRange } from '../Node';
import { ExportableDeclaration } from './Declaration';
import { MethodDeclaration } from './MethodDeclaration';
import { PropertyDeclaration } from './PropertyDeclaration';
import { Serializable } from 'ts-json-serializer';
import { CompletionItemKind, Range, TextDocument } from 'vscode-languageserver-types';

/**
 * Interface declaration that contains defined properties and methods.
 * 
 * @export
 * @class InterfaceDeclaration
 * @implements {ExportableDeclaration}
 */
@Serializable({
    factory: json => {
        const obj = new InterfaceDeclaration(json.name, json.isExported, json.start, json.end);
        obj.properties = json.properties;
        obj.methods = json.methods;
        return obj;
    }
})
export class InterfaceDeclaration implements ExportableDeclaration {
    public properties: PropertyDeclaration[] = [];
    public methods: MethodDeclaration[] = [];

    public get itemKind(): CompletionItemKind {
        return CompletionItemKind.Interface;
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
     * @memberOf InterfaceDeclaration
     */
    public getRange(document: TextDocument): Range {
        return nodeRange(document, this.start, this.end);
    }

    /**
     * Generates typescript code out of the actual import.
     * 
     * @returns {string}
     * 
     * @memberOf InterfaceDeclaration
     */
    public generateTypescript(): string {
        throw new NotImplementedYetError();
    }
}
