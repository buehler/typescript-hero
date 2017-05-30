import { ExportableDeclaration, TypedDeclaration } from './Declaration';
import { Serializable } from 'ts-json-serializer';
import { CompletionItemKind } from 'vscode-languageserver-types';

/**
 * Variable declaration. Is contained in a method or function, or can be exported.
 * 
 * @export
 * @class VariableDeclaration
 * @implements {ExportableDeclaration}
 * @implements {TypedDeclaration}
 */
@Serializable({
    factory: json => new VariableDeclaration(
        json.name, json.isConst, json.isExported, json.type, json.start, json.end,
    ),
})
export class VariableDeclaration implements ExportableDeclaration, TypedDeclaration {
    public get itemKind(): CompletionItemKind {
        return CompletionItemKind.Variable;
    }

    public get intellisenseSortKey(): string {
        return `1_${this.name}`;
    }

    constructor(
        public name: string,
        public isConst: boolean,
        public isExported: boolean,
        public type: string | undefined,
        public start?: number,
        public end?: number,
    ) { }

    /**
     * Generates typescript code out of the actual import.
     * 
     * @returns {string}
     * 
     * @memberOf VariableDeclaration
     */
    public generateTypescript(): string {
        return `${this.name}${this.type ? `: ${this.type}` : ''}`;
    }
}
