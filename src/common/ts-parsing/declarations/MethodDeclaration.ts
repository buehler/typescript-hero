import { GenerationOptions } from '../../ts-generation';
import { AbstractDeclaration, CallableDeclaration, ScopedDeclaration, TypedDeclaration } from './Declaration';
import { DeclarationVisibility, getVisibilityText } from './DeclarationVisibility';
import { ParameterDeclaration } from './ParameterDeclaration';
import { VariableDeclaration } from './VariableDeclaration';
import { Serializable } from 'ts-json-serializer';
import { CompletionItemKind } from 'vscode-languageserver-types';

/**
 * Method declaration. A method is contained in an interface or a class.
 * Contains information abount the method itself.
 * 
 * @export
 * @class MethodDeclaration
 * @implements {CallableDeclaration}
 * @implements {ScopedDeclaration}
 * @implements {TypedDeclaration}
 */
@Serializable({
    factory: (json) => {
        const obj = new MethodDeclaration(json.name, json.isExported, json.visibility, json.type, json.start, json.end);
        obj.parameters = json.parameters;
        obj.variables = json.variables;
        return obj;
    },
})
export class MethodDeclaration implements AbstractDeclaration, CallableDeclaration, ScopedDeclaration, TypedDeclaration {
    public parameters: ParameterDeclaration[] = [];
    public variables: VariableDeclaration[] = [];

    public get itemKind(): CompletionItemKind {
        return CompletionItemKind.Method;
    }

    public get intellisenseSortKey(): string {
        return `0_${this.name}`;
    }

    constructor(
        public name: string,
        public isAbstract: boolean,
        public visibility: DeclarationVisibility | undefined,
        public type: string | undefined,
        public start?: number,
        public end?: number,
    ) { }

    /**
     * Generates typescript code out of the actual import.
     * 
     * @param {GenerationOptions} {tabSize}
     * @returns {string}
     * 
     * @memberOf MethodDeclaration
     */
    public generateTypescript({ tabSize }: GenerationOptions): string {
        const intend = Array(tabSize + 1).join(' ');
        return `${intend}` +
            `${this.visibility !== undefined ? getVisibilityText(this.visibility) + ' ' : ''}${this.name}(` +
            `${this.parameters.map(o => o.generateTypescript()).join(', ')})` +
            `${this.type ? `: ${this.type}` : ''} {
${intend}${intend}throw new Error('Not implemented yet.');
${intend}}\n`;
    }
}
