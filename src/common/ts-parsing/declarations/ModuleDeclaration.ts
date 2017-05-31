import { NotImplementedYetError } from '../../errors';
import { Declaration } from './Declaration';
import { Serializable } from 'ts-json-serializer';
import { CompletionItemKind } from 'vscode-languageserver-types';

/**
 * Module (namespace) declaration. Does export a whole module or namespace that is mainly used by
 * external declaration files.
 * 
 * @export
 * @class ModuleDeclaration
 * @implements {Declaration}
 */
@Serializable({
    factory: json => new ModuleDeclaration(
        json.name, json.start, json.end,
    ),
})
export class ModuleDeclaration implements Declaration {
    public get itemKind(): CompletionItemKind {
        return CompletionItemKind.Module;
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
     * @memberof ModuleDeclaration
     */
    public generateTypescript(): string {
        throw new NotImplementedYetError();
    }
}
