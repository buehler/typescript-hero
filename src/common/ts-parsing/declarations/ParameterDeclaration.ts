import { TypedDeclaration } from './Declaration';
import { Serializable } from 'ts-json-serializer';
import { CompletionItemKind } from 'vscode-languageserver-types';

/**
 * Parameter declaration. Is contained in a method or function delaration since a parameter can not be exported
 * by itself.
 * 
 * @export
 * @class ParameterDeclaration
 * @implements {TypedDeclaration}
 */
@Serializable({
    factory: json => new ParameterDeclaration(
        json.name, json.type, json.start, json.end
    )
})
export class ParameterDeclaration implements TypedDeclaration {
    public get itemKind(): CompletionItemKind {
        return CompletionItemKind.Variable;
    }

    public get intellisenseSortKey(): string {
        return `0_${this.name}`;
    }

    constructor(public name: string, public type: string | undefined, public start?: number, public end?: number) { }

    /**
     * Generates typescript code out of the actual import.
     * 
     * @returns {string}
     * 
     * @memberOf ParameterDeclaration
     */
    public generateTypescript(): string {
        return `${this.name}${this.type ? `: ${this.type}` : ''}`;
    }
}
