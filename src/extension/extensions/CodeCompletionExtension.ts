import { inject, injectable } from 'inversify';
import { DeclarationIndex, DeclarationInfo, TypescriptParser } from 'typescript-parser';
import {
    CancellationToken,
    commands,
    CompletionItem,
    CompletionItemProvider,
    ExtensionContext,
    languages,
    Position,
    TextDocument,
    Disposable,
    workspace,
} from 'vscode';

import { ExtensionConfig } from '../../common/config';
import { getDeclarationsFilteredByImports } from '../../common/helpers';
import { Logger, LoggerFactory } from '../../common/utilities';
import { iocSymbols } from '../IoCSymbols';
import { ImportManager } from '../managers/ImportManager';
import { getItemKind } from '../utilities/utilityFunctions';
import { BaseExtension } from './BaseExtension';

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
    private languageRegisters: Disposable[] = [];

    constructor(
        @inject(iocSymbols.extensionContext) context: ExtensionContext,
        @inject(iocSymbols.loggerFactory) loggerFactory: LoggerFactory,
        @inject(iocSymbols.typescriptParser) private parser: TypescriptParser,
        @inject(iocSymbols.declarationIndex) private index: DeclarationIndex,
        @inject(iocSymbols.rootPath) private rootPath: string,
        @inject(iocSymbols.configuration) private config: ExtensionConfig,
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
        for (const lang of this.config.resolver.resolverModeLanguages) {
            this.languageRegisters.push(languages.registerCompletionItemProvider(lang, this));
        }

        this.context.subscriptions.push(workspace.onDidChangeConfiguration(() => {
            if (this.languageRegisters.length !== this.config.resolver.resolverModeLanguages.length) {
                this.logger.info('ResolverMode has changed, registering to new configuration languages');
                for (const register of this.languageRegisters) {
                    register.dispose();
                }
                this.languageRegisters = [];
                for (const lang of this.config.resolver.resolverModeLanguages) {
                    this.languageRegisters.push(languages.registerCompletionItemProvider(lang, this));
                }
            }
        }));

        this.context.subscriptions.push(
            commands.registerCommand(
                'typescriptHero.codeCompletion.executeIntellisenseItem',
                (document: TextDocument, declaration: DeclarationInfo) =>
                    this.executeIntellisenseItem(document, declaration),
            ),
        );

        this.logger.info('Initialized');
    }

    /**
     * Disposes the extension.
     * 
     * @memberof CodeCompletionExtension
     */
    public dispose(): void {
        for (const register of this.languageRegisters) {
            register.dispose();
        }
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
            lineText.startsWith('import ') ||
            lineText.substring(0, position.character).match(new RegExp(`(\w*[.])+${searchWord}`, 'g'))) {
            return Promise.resolve(null);
        }

        this.logger.info('Search completion for word.', { searchWord });

        const parsed = await this.parser.parseSource(document.getText());
        const declarations = getDeclarationsFilteredByImports(
            this.index.declarationInfos,
            document.fileName,
            parsed.imports,
            this.rootPath,
        )
            .filter(o => !parsed.declarations.some(d => d.name === o.declaration.name))
            .filter(o => !parsed.usages.some(d => d === o.declaration.name));

        const items: CompletionItem[] = [];
        for (const declaration of declarations.filter(
            o => o.declaration.name.toLowerCase().indexOf(searchWord.toLowerCase()) >= 0)
        ) {
            const item = new CompletionItem(declaration.declaration.name, getItemKind(declaration.declaration));

            item.detail = declaration.from;
            item.command = {
                arguments: [document, declaration],
                title: 'Execute intellisense insert',
                command: 'typescriptHero.codeCompletion.executeIntellisenseItem',
            };
            items.push(item);
        }
        return items;
    }

    /**
     * Executes a intellisense item that provided a document and a declaration to add.
     * Does make the calculation of the text edits async.
     * 
     * @private
     * @param {TextDocument} document 
     * @param {DeclarationInfo} declaration 
     * @returns {Promise<void>} 
     * @memberof CodeCompletionExtension
     */
    private async executeIntellisenseItem(document: TextDocument, declaration: DeclarationInfo): Promise<void> {
        const manager = await ImportManager.create(document);
        manager.addDeclarationImport(declaration);
        await manager.commit();
    }
}
