import { GenerationOptions } from '../../ts-generation';
import { ScopedDeclaration, TypedDeclaration } from './Declaration';
import { DeclarationVisibility, getVisibilityText } from './DeclarationVisibility';
import { Serializable } from 'ts-json-serializer';
import { CompletionItemKind } from 'vscode-languageserver-types';

/**
 * Property declaration that contains its visibility.
 *
 * @export
 * @class PropertyDeclaration
 * @implements {ScopedDeclaration}
 * @implements {TypedDeclaration}
 */
@Serializable({
    factory: json => new PropertyDeclaration(
        json.name, json.visibility, json.type, json.start, json.end
    )
})
export class PropertyDeclaration implements ScopedDeclaration, TypedDeclaration {
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
