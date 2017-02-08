import { GenerationOptions } from '../../ts-generation';
import { nodeRange } from '../Node';
import { ScopedDeclaration, TypedDeclaration } from './Declaration';
import { DeclarationVisibility, getVisibilityText } from './DeclarationVisibility';
import { CompletionItemKind, Range, TextDocument } from 'vscode-languageserver-types';

/**
 * Property declaration that contains its visibility.
 *
 * @export
 * @class PropertyDeclaration
 * @implements {ScopedDeclaration}
 * @implements {TypedDeclaration}
 */
export class PropertyDeclaration implements ScopedDeclaration, TypedDeclaration {
    public readonly _type: string = 'PropertyDeclaration';

    public get itemKind(): CompletionItemKind {
        return CompletionItemKind.Property;
    }

    public get intellisenseSortKey(): string {
        return `0_${this.name}`;
    }

    constructor(
        public name: string,
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
     * @memberOf PropertyDeclaration
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
     * @memberOf PropertyDeclaration
     */
    public generateTypescript({tabSize}: GenerationOptions): string {
        return `${Array(tabSize + 1).join(' ')}${this.visibility ? getVisibilityText(this.visibility) + ' ' : ''}` +
            `${this.name}${this.type ? `: ${this.type}` : ''};\n`;
    }
}
