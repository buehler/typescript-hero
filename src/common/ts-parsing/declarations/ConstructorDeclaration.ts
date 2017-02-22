import { NotImplementedYetError } from '../../errors';
import { DocumentLike, nodeRange } from '../Node';
import { CallableDeclaration } from './Declaration';
import { ParameterDeclaration } from './ParameterDeclaration';
import { VariableDeclaration } from './VariableDeclaration';
import { Serializable } from 'ts-json-serializer';
import { CompletionItemKind, Range } from 'vscode-languageserver-types';

/**
 * Constructor declaration that is contained in a class.
 * 
 * @export
 * @class ConstructorDeclaration
 * @implements {CallableDeclaration}
 */
@Serializable({
    factory: json => {
        const obj = new ConstructorDeclaration(json.name, json.start, json.end);
        obj.parameters = json.parameters;
        obj.variables = json.variables;
        return obj;
    }
})
export class ConstructorDeclaration implements CallableDeclaration {
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
     * @param {DocumentLike} document
     * @returns {Range}
     * 
     * @memberOf ConstructorDeclaration
     */
    public getRange(document: DocumentLike): Range {
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
