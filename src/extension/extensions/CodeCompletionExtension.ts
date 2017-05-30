import { ExtensionConfig } from '../../common/config';
import {
    getAbsolutLibraryName,
    getDeclarationsFilteredByImports,
    getImportInsertPosition,
    getRelativeLibraryName,
} from '../../common/helpers';
import { SymbolSpecifier, TypescriptParser } from '../../common/ts-parsing';
import { DeclarationInfo, DefaultDeclaration, ModuleDeclaration } from '../../common/ts-parsing/declarations';
import { NamedImport, NamespaceImport } from '../../common/ts-parsing/imports';
import { File } from '../../common/ts-parsing/resources';
import { Logger, LoggerFactory } from '../../common/utilities';
import { CalculatedDeclarationIndex } from '../declarations/CalculatedDeclarationIndex';
import { importRange } from '../helpers';
import { iocSymbols } from '../IoCSymbols';
import { BaseExtension } from './BaseExtension';
import { inject, injectable } from 'inversify';
import {
    CancellationToken,
    CompletionItem,
    CompletionItemProvider,
    ExtensionContext,
    languages,
    Position,
    TextDocument,
    TextEdit,
    window,
    workspace,
} from 'vscode';

/**
 * TODO
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
        @inject(iocSymbols.configuration) private config: ExtensionConfig,
        private parser: TypescriptParser,
        private index: CalculatedDeclarationIndex,
    ) {
        super(context);
        this.logger = loggerFactory('CodeCompletionExtension');
    }

    /**
     * Initialized the extension. Registers the commands and other disposables to the context.
     * 
     * @memberOf CodeCompletionExtension
     */
    public initialize(): void {
        this.context.subscriptions.push(languages.registerCompletionItemProvider('typescript', this));
        this.context.subscriptions.push(languages.registerCompletionItemProvider('typescriptreact', this));

        this.logger.info('Initialized');
    }

    /**
     * Disposes the extension.
     * 
     * @memberOf CodeCompletionExtension
     */
    public dispose(): void {
        this.logger.info('Disposed');
    }

    /**
     * TODO
     * 
     * @param {TextDocument} document 
     * @param {Position} position 
     * @param {CancellationToken} token 
     * @returns {Promise<(CompletionItem[] | null)>} 
     * 
     * @memberOf CodeCompletionExtension
     */
    public async provideCompletionItems(
        document: TextDocument,
        position: Position,
        token: CancellationToken,
    ): Promise<CompletionItem[] | null> {
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

        const declarations = getDeclarationsFilteredByImports(
            this.index.declarationInfos,
            document.fileName,
            workspace.rootPath,
            parsed.imports,
        )
            .filter(o => !parsed.declarations.some(d => d.name === o.declaration.name))
            .filter(o => !parsed.usages.some(d => d === o.declaration.name));

        return declarations
            .filter(o => o.declaration.name.toLowerCase().indexOf(searchWord.toLowerCase()) >= 0)
            .map((o) => {
                const item = new CompletionItem(o.declaration.name, o.declaration.itemKind);
                item.detail = o.from;
                item.sortText = o.declaration.intellisenseSortKey;
                item.additionalTextEdits = this.calculateTextEdits(o, document, parsed);
                return item;
            });
    }

    /**
     * 
     * 
     * @private
     * @param {DeclarationInfo} declaration 
     * @param {TextDocument} document 
     * @param {File} parsedSource 
     * @returns {TextEdit[]} 
     * 
     * @memberOf CodeCompletionExtension
     */
    private calculateTextEdits(declaration: DeclarationInfo, document: TextDocument, parsedSource: File): TextEdit[] {
        const imp = parsedSource.imports.find((o) => {
            if (o instanceof NamedImport) {
                const importedLib = getAbsolutLibraryName(o.libraryName, document.fileName, workspace.rootPath);
                return importedLib === declaration.from;
            }
            return false;
        });

        if (imp && imp instanceof NamedImport) {
            const modifiedImp = imp.clone();
            modifiedImp.specifiers.push(new SymbolSpecifier(declaration.declaration.name));

            return [
                TextEdit.replace(
                    importRange(document, imp.start, imp.end),
                    modifiedImp.generateTypescript(this.config.resolver.generationOptions),
                ),
            ];
        } else if (declaration.declaration instanceof ModuleDeclaration) {
            const mod = new NamespaceImport(declaration.from, declaration.declaration.name);
            return [
                TextEdit.insert(
                    getImportInsertPosition(
                        this.config.resolver.newImportLocation, window.activeTextEditor,
                    ),
                    mod.generateTypescript(this.config.resolver.generationOptions),
                ),
            ];
        } else if (declaration.declaration instanceof DefaultDeclaration) {
            // TODO: when the completion starts, the command should add the text edit.
        } else {
            const library = getRelativeLibraryName(declaration.from, document.fileName, workspace.rootPath);
            const named = new NamedImport(library);
            named.specifiers.push(new SymbolSpecifier(declaration.declaration.name));
            return [
                TextEdit.insert(
                    getImportInsertPosition(
                        this.config.resolver.newImportLocation, window.activeTextEditor,
                    ),
                    named.generateTypescript(this.config.resolver.generationOptions),
                ),
            ];
        }
        return [];
    }
}
