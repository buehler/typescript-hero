import { importRange } from '../helpers';
import { SymbolSpecifier, TypescriptParser } from '../../common/ts-parsing';
import { getAbsolutLibraryName, getDeclarationsFilteredByImports } from '../../common/helpers';
import { NamedImport } from '../../common/ts-parsing/imports';
import { File } from '../../common/ts-parsing/resources';
import { DeclarationInfo } from '../../common/ts-parsing/declarations';
import { Request } from '../../common/communication';
import { CompletionInformation } from '../../common/transport-models';
import { ExtensionConfig } from '../../common/config';
import { Logger, LoggerFactory } from '../../common/utilities';
import { iocSymbols } from '../IoCSymbols';
import { ClientConnection } from '../utilities/ClientConnection';
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
    workspace
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
        private connection: ClientConnection
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
        token: CancellationToken
    ): Promise<CompletionItem[] | null> {
        const wordAtPosition = document.getWordRangeAtPosition(position),
            lineText = document.lineAt(position.line).text;

        let searchWord = '';

        if (wordAtPosition && wordAtPosition.start.character < position.character) {
            const word = document.getText(wordAtPosition);
            searchWord = word.substr(0, position.character - wordAtPosition.start.character);
        }

        if (!searchWord ||
            token.isCancellationRequested ||
            !(await this.connection.sendRequest<boolean>(Request.DeclarationIndexReady)) ||
            (lineText.substring(0, position.character).match(/["'`]/g) || []).length % 2 === 1 ||
            lineText.match(/^\s*(\/\/|\/\*\*|\*\/|\*)/g) ||
            lineText.match(/^import .*$/g) ||
            lineText.substring(0, position.character).match(new RegExp(`(\w*[.])+${searchWord}`, 'g'))) {
            return Promise.resolve(null);
        }

        this.logger.info('Search completion for word.', { searchWord });

        const parsed = await this.parser.parseSource(document.getText());

        let declarations = getDeclarationsFilteredByImports(this.index, document.fileName, parsed.imports)
            .filter(o => !parsed.declarations.some(d => d.name === o.declaration.name))
            .filter(o => !parsed.usages.some(d => d === o.declaration.name));

        return declarations
            .filter(o => o.declaration.name.toLowerCase().indexOf(searchWord.toLowerCase()) >= 0)
            .map(o => {
                let item = new CompletionItem(o.declaration.name, o.declaration.itemKind);
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
        const imp = parsedSource.imports.find(o => {
            if (o instanceof NamedImport) {
                let importedLib = getAbsolutLibraryName(o.libraryName, document.fileName, workspace.rootPath);
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
                    modifiedImp.generateTypescript(this.config.resolver.importOptions)
                )
            ];
        } else if (declaration.declaration instanceof ModuleDeclaration) {
            let mod = new TsNamespaceImport(declaration.from, declaration.declaration.name);
            return [
                TextEdit.insert(
                    getImportInsertPosition(
                        this.config.resolver.newImportLocation, window.activeTextEditor
                    ),
                    mod.toImport(this.config.resolver.importOptions)
                )
            ];
        } else if (declaration.declaration instanceof DefaultDeclaration) {
            // TODO: when the completion starts, the command should add the text edit.
        } else {
            let library = getRelativeLibraryName(declaration.from, document.fileName);
            let named = new TsNamedImport(library);
            named.specifiers.push(new TsResolveSpecifier(declaration.declaration.name));
            return [
                TextEdit.insert(
                    getImportInsertPosition(
                        this.config.resolver.newImportLocation, window.activeTextEditor
                    ),
                    named.toImport(this.config.resolver.importOptions)
                )
            ];
        }
    }
}

// /**
//  * Provider instance that gives the user code completion (intellisense).
//  * Is responsible for parsing the actual document and create the actions needed to import a new symbol.
//  * 
//  * @export
//  * @class ResolveCompletionItemProvider
//  * @implements {CompletionItemProvider}
//  */
// @injectable()
// export class ResolveCompletionItemProvider implements CompletionItemProvider {
//     private logger: Logger;

//     constructor(
//         @inject('LoggerFactory') loggerFactory: LoggerFactory,
//         private config: ExtensionConfig,
//         private index: ResolveIndex,
//         private parser: TsResourceParser
//     ) {
//         this.logger = loggerFactory('ResolveCompletionItemProvider');
//         this.logger.info('Instantiated.');
//     }

//     /**
//      * Provides the completion list to vscode.
//      * Calculates auto imports based on various situations.
//      * 
//      * @param {TextDocument} document
//      * @param {Position} position
//      * @param {CancellationToken} token
//      * @returns {Promise<CompletionItem[]>}
//      * 
//      * @memberOf ResolveCompletionItemProvider
//      */
//     public async provideCompletionItems(
//         document: TextDocument,
//         position: Position,
//         token: CancellationToken
//     ): Promise<CompletionItem[]> {
//         let wordAtPosition = document.getWordRangeAtPosition(position),
//             lineText = document.lineAt(position.line).text,
//             searchWord = '';

//         if (wordAtPosition && wordAtPosition.start.character < position.character) {
//             let word = document.getText(wordAtPosition);
//             searchWord = word.substr(0, position.character - wordAtPosition.start.character);
//         }

//         if (!searchWord ||
//             token.isCancellationRequested ||
//             !this.index.indexReady ||
//             (lineText.substring(0, position.character).match(/["'`]/g) || []).length % 2 === 1 ||
//             lineText.match(/^\s*(\/\/|\/\*\*|\*\/|\*)/g) ||
//             lineText.match(/^import .*$/g) ||
//             lineText.substring(0, position.character).match(new RegExp(`(\w*[.])+${searchWord}`, 'g'))) {
//             return Promise.resolve(null);
//         }

//         this.logger.info('Search completion for word.', { searchWord });


//         if (token.isCancellationRequested) {
//             return [];
//         }

//         let parsed = await this.parser.parseSource(document.getText());
//         let declarations = getDeclarationsFilteredByImports(this.index, document.fileName, parsed.imports)
//             .filter(o => !parsed.declarations.some(d => d.name === o.declaration.name))
//             .filter(o => !parsed.usages.some(d => d === o.declaration.name));

//         let filtered = declarations
//             .filter(o => o.declaration.name.toLowerCase().indexOf(searchWord.toLowerCase()) >= 0)
//             .map(o => {
//                 let item = new CompletionItem(o.declaration.name, o.declaration.itemKind);
//                 item.detail = o.from;
//                 item.sortText = o.declaration.intellisenseSortKey;
//                 item.additionalTextEdits = this.calculateTextEdits(o, document, parsed);
//                 return item;
//             });

//         if (token.isCancellationRequested) {
//             return [];
//         }

//         return filtered;
//     }


