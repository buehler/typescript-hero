import { NotImplementedYetError } from '../../errors';
import { CallableDeclaration } from './Declaration';
import { ParameterDeclaration } from './ParameterDeclaration';
import { VariableDeclaration } from './VariableDeclaration';
import { Serializable } from 'ts-json-serializer';
import { CompletionItemKind } from 'vscode-languageserver-types';

/**
 * Constructor declaration that is contained in a class.
 * 
 * @export
 * @class ConstructorDeclaration
 * @implements {CallableDeclaration}
 */
@Serializable({
    factory: (json) => {
        const obj = new ConstructorDeclaration(json.name, json.start, json.end);
        obj.parameters = json.parameters;
        obj.variables = json.variables;
        return obj;
    },
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
        public end?: number,
    ) { }

    /**
     * Generates typescript code out of the actual import.
     * 
     * @returns {string}
     * 
     * @memberof ConstructorDeclaration
     */
    public generateTypescript(): string {
        throw new NotImplementedYetError();
    }
}
