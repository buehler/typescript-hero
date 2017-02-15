import { NotImplementedYetError } from '../../errors';
import { nodeRange } from '../Node';
import { CallableDeclaration, ExportableDeclaration } from './Declaration';
import { ParameterDeclaration } from './ParameterDeclaration';
import { VariableDeclaration } from './VariableDeclaration';
import { Serializable } from 'ts-json-serializer';
import { CompletionItemKind, Range, TextDocument } from 'vscode-languageserver-types';

/**
 * Function declaration. Like the MethodDeclaration it contains the base info about the function
 * and additional stuff.
 * 
 * @export
 * @class FunctionDeclaration
 * @implements {CallableDeclaration}
 * @implements {ExportableDeclaration}
 */
@Serializable({
    factory: json => {
        const obj = new FunctionDeclaration(json.name, json.isExported, json.type, json.start, json.end);
        obj.parameters = json.parameters;
        obj.variables = json.variables;
        return obj;
    }
})
export class FunctionDeclaration implements CallableDeclaration, ExportableDeclaration {
    public parameters: ParameterDeclaration[] = [];
    public variables: VariableDeclaration[] = [];

    public get itemKind(): CompletionItemKind {
        return CompletionItemKind.Function;
    }

    public get intellisenseSortKey(): string {
        return `0_${this.name}`;
    }

    constructor(
        public name: string,
        public isExported: boolean,
        public type?: string,
        public start?: number,
        public end?: number
    ) { }

    /**
     * Calculates the document range of the node in the given document.
     * 
     * @param {TextDocument} document
     * @returns {Range}
     * 
     * @memberOf FunctionDeclaration
     */
    public getRange(document: TextDocument): Range {
        return nodeRange(document, this.start, this.end);
    }

    /**
     * Generates typescript code out of the actual import.
     * 
     * @returns {string}
     * 
     * @memberOf FunctionDeclaration
     */
    public generateTypescript(): string {
        throw new NotImplementedYetError();
    }
}
