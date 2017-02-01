import { DeclarationInfo, ResolveIndex } from '../caches/ResolveIndex';
import { ExtensionConfig } from '../ExtensionConfig';
import { DefaultDeclaration, ModuleDeclaration } from '../models/TsDeclaration';
import { TsNamedImport, TsNamespaceImport } from '../models/TsImport';
import { TsResolveSpecifier } from '../models/TsResolveSpecifier';
import { TsFile } from '../models/TsResource';
import { TsResourceParser } from '../parser/TsResourceParser';
import { Logger, LoggerFactory } from '../utilities/Logger';
import {
    getAbsolutLibraryName,
    getDeclarationsFilteredByImports,
    getImportInsertPosition,
    getRelativeLibraryName
} from '../utilities/ResolveIndexExtensions';
import { inject, injectable } from 'inversify';
import {
    CancellationToken,
    CompletionItem,
    CompletionItemProvider,
    Position,
    TextDocument,
    TextEdit,
    window
} from 'vscode';

/**
 * Provider instance that gives the user code completion (intellisense).
 * Is responsible for parsing the actual document and create the actions needed to import a new symbol.
 * 
 * @export
 * @class ResolveCompletionItemProvider
 * @implements {CompletionItemProvider}
 */
@injectable()
export class ResolveCompletionItemProvider implements CompletionItemProvider {
    private logger: Logger;

    constructor(
        @inject('LoggerFactory') loggerFactory: LoggerFactory,
        private config: ExtensionConfig,
        private index: ResolveIndex,
        private parser: TsResourceParser
    ) {
        this.logger = loggerFactory('ResolveCompletionItemProvider');
        this.logger.info('Instantiated.');
    }

    /**
     * Provides the completion list to vscode.
     * Calculates auto imports based on various situations.
     * 
     * @param {TextDocument} document
     * @param {Position} position
     * @param {CancellationToken} token
     * @returns {Promise<CompletionItem[]>}
     * 
     * @memberOf ResolveCompletionItemProvider
     */
    public async provideCompletionItems(
        document: TextDocument,
        position: Position,
        token: CancellationToken
    ): Promise<CompletionItem[]> {
        let wordAtPosition = document.getWordRangeAtPosition(position),
            lineText = document.lineAt(position.line).text,
            searchWord = '';

        if (wordAtPosition && wordAtPosition.start.character < position.character) {
            let word = document.getText(wordAtPosition);
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

        let parsed = await this.parser.parseSource(document.getText());

        if (token.isCancellationRequested) {
            return [];
        }

        let declarations = getDeclarationsFilteredByImports(this.index, document.fileName, parsed.imports)
            .filter(o => !parsed.declarations.some(d => d.name === o.declaration.name))
            .filter(o => !parsed.usages.some(d => d === o.declaration.name));

        let filtered = declarations
            .filter(o => o.declaration.name.toLowerCase().indexOf(searchWord.toLowerCase()) >= 0)
            .map(o => {
                let item = new CompletionItem(o.declaration.name, o.declaration.itemKind);
                item.detail = o.from;
                item.sortText = o.declaration.intellisenseSortKey;
                item.additionalTextEdits = this.calculateTextEdits(o, document, parsed);
                return item;
            });

        if (token.isCancellationRequested) {
            return [];
        }

        return filtered;
    }

    /**
     * Internal method that calculates the needed TextEdits to a given document to import the symbol.
     * 
     * @private
     * @param {DeclarationInfo} declaration
     * @param {TextDocument} document
     * @param {TsFile} parsedSource
     * @returns {TextEdit[]}
     * 
     * @memberOf ResolveCompletionItemProvider
     */
    private calculateTextEdits(declaration: DeclarationInfo, document: TextDocument, parsedSource: TsFile): TextEdit[] {
        let imp = parsedSource.imports.find(o => {
            if (o instanceof TsNamedImport) {
                let importedLib = getAbsolutLibraryName(o.libraryName, document.fileName);
                return importedLib === declaration.from;
            }
            return false;
        });

        if (imp && imp instanceof TsNamedImport) {
            let modifiedImp = imp.clone();
            modifiedImp.specifiers.push(new TsResolveSpecifier(declaration.declaration.name));

            return [
                TextEdit.replace(imp.getRange(document), modifiedImp.toImport(this.config.resolver.importOptions))
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
