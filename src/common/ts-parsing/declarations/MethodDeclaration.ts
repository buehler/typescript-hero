import { GenerationOptions } from '../../ts-generation';
import { nodeRange } from '../Node';
import { CallableDeclaration, ScopedDeclaration, TypedDeclaration } from './Declaration';
import { DeclarationVisibility, getVisibilityText } from './DeclarationVisibility';
import { ParameterDeclaration } from './ParameterDeclaration';
import { VariableDeclaration } from './VariableDeclaration';
import { CompletionItemKind, Range, TextDocument } from 'vscode-languageserver-types';

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
export class MethodDeclaration implements CallableDeclaration, ScopedDeclaration, TypedDeclaration {
    public readonly _type: string = 'MethodDeclaration';

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
        public isExported: boolean,
        public visibility: DeclarationVisibility | undefined,
        public type: string | undefined,
        public start?: number,
        public end?: number
    ) { }

    /**
     * Calculates the document range of the node in the given document.
     * 
     * @param {TextDocument} document
     * @returns {Range}
     * 
     * @memberOf MethodDeclaration
     */
    public getRange(document: TextDocument): Range {
        return nodeRange(document, this.start, this.end);
    }

    /**
     * Generates typescript code out of the actual import.
     * 
     * @param {GenerationOptions} {tabSize}
     * @returns {string}
     * 
     * @memberOf MethodDeclaration
     */
    public generateTypescript({tabSize}: GenerationOptions): string {
        let intend = Array(tabSize + 1).join(' ');
        return `${intend}${this.visibility ? getVisibilityText(this.visibility) + ' ' : ''}${this.name}(` +
            `${this.parameters.map(o => o.generateTypescript()).join(', ')})` +
            `${this.type ? `: ${this.type}` : ''} {
${intend}${intend}throw new Error('Not implemented yet.');
${intend}}\n`;
    }
}
