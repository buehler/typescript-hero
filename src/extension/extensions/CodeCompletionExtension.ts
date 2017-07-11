import { inject, injectable } from 'inversify';
import { DeclarationIndex, TypescriptParser } from 'typescript-parser';
import {
    CancellationToken,
    CompletionItem,
    CompletionItemProvider,
    ExtensionContext,
    languages,
    Position,
    TextDocument,
    workspace,
} from 'vscode';

import { getDeclarationsFilteredByImports } from '../../common/helpers';
import { Logger, LoggerFactory } from '../../common/utilities';
import { iocSymbols } from '../IoCSymbols';
import { ImportManager } from '../managers/ImportManager';
import { BaseExtension } from './BaseExtension';

/**
 * TODO
 * 
 */
function getItemKind(): void {

}

/**
 * TODO
 * 
 */
function getSortKey(): void {

}

/**
 * Extension that provides code completion for typescript files. Uses the calculated index to provide information.
 * 
 * @export
 * @class CodeCompletionExtension
 * @extends {BaseExtension}
 * @implements {CompletionItemProvider}
 */
@injectable()
export class CodeCompletionExtension extends BaseExtension implements CompletionItemProvider {
    private logger: Logger;

    constructor(
        @inject(iocSymbols.extensionContext) context: ExtensionContext,
        @inject(iocSymbols.loggerFactory) loggerFactory: LoggerFactory,
        private parser: TypescriptParser,
        private index: DeclarationIndex,
    ) {
        super(context);
        this.logger = loggerFactory('CodeCompletionExtension');
    }

    /**
     * Initialized the extension. Registers the commands and other disposables to the context.
     * 
     * @memberof CodeCompletionExtension
     */
    public initialize(): void {
        this.context.subscriptions.push(languages.registerCompletionItemProvider('typescript', this));
        this.context.subscriptions.push(languages.registerCompletionItemProvider('typescriptreact', this));

        this.logger.info('Initialized');
    }

    /**
     * Disposes the extension.
     * 
     * @memberof CodeCompletionExtension
     */
    public dispose(): void {
        this.logger.info('Disposed');
    }

    /**
     * Provides completion items for a given position in the given document.
     * 
     * @param {TextDocument} document 
     * @param {Position} position 
     * @param {CancellationToken} token 
     * @returns {Promise<(CompletionItem[] | null)>} 
     * 
     * @memberof CodeCompletionExtension
     */
    public async provideCompletionItems(
        document: TextDocument,
        position: Position,
        token: CancellationToken,
    ): Promise<CompletionItem[] | null> {
        if (!this.index.indexReady) {
            return null;
        }

        const wordAtPosition = document.getWordRangeAtPosition(position);
        const lineText = document.lineAt(position.line).text;

        let searchWord = '';

        if (wordAtPosition && wordAtPosition.start.character < position.character) {
            const word = document.getText(wordAtPosition);
            searchWord = word.substr(0, position.character - wordAtPosition.start.character);
        }

        if (!searchWord ||
            token.isCancellationRequested ||
            !this.index.indexReady ||
            (lineText.substring(0, position.character).match(/["'`]/g) || []).length % 2 === 1 ||
            lineText.match(/^\s*(\/\/|\/\*\*|\*\/|\*)/g) ||
            lineText.match(/^import .*$/g) ||
            lineText.substring(0, position.character).match(new RegExp(`(\w*[.])+${searchWord}`, 'g'))) {
            return Promise.resolve(null);
        }

        this.logger.info('Search completion for word.', { searchWord });

        const parsed = await this.parser.parseSource(document.getText());
        const manager = await ImportManager.create(document);

        const declarations = getDeclarationsFilteredByImports(
            this.index.declarationInfos,
            document.fileName,
            parsed.imports,
            workspace.rootPath,
        )
            .filter(o => !parsed.declarations.some(d => d.name === o.declaration.name))
            .filter(o => !parsed.usages.some(d => d === o.declaration.name));

        const items: CompletionItem[] = [];
        for (const declaration of declarations.filter(
            o => o.declaration.name.toLowerCase().indexOf(searchWord.toLowerCase()) >= 0)
        ) {
            const item = new CompletionItem(declaration.declaration.name, declaration.declaration.itemKind);
            
            manager.addDeclarationImport(declaration);
            item.detail = declaration.from;
            item.sortText = declaration.declaration.intellisenseSortKey;
            item.additionalTextEdits = manager.calculateTextEdits();
            items.push(item);

            manager.reset();
        }
        return items;
    }
}
