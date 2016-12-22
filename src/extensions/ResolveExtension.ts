import { ResolveIndex } from '../caches/ResolveIndex';
import { ExtensionConfig } from '../ExtensionConfig';
import { ImportManager } from '../managers/ImportManager';
import { CommandQuickPickItem, ResolveQuickPickItem } from '../models/QuickPickItems';
import { TshCommand } from '../models/TshCommand';
import { TsResourceParser } from '../parser/TsResourceParser';
import { ResolveCompletionItemProvider } from '../provider/ResolveCompletionItemProvider';
import { ResolveQuickPickProvider } from '../provider/ResolveQuickPickProvider';
import { Logger, LoggerFactory } from '../utilities/Logger';
import { BaseExtension } from './BaseExtension';
import { inject, injectable } from 'inversify';
import {
    commands,
    ExtensionContext,
    FileSystemWatcher,
    languages,
    StatusBarAlignment,
    StatusBarItem,
    Uri,
    window,
    workspace
} from 'vscode';

type ImportInformation = {};

const resolverOk = 'Resolver $(check)',
    resolverSyncing = 'Resolver $(sync)',
    resolverErr = 'Resolver $(flame)';

/**
 * Compares the ignorepatterns (if they have the same elements ignored).
 * 
 * @param {string[]} local
 * @param {string[]} config
 * @returns {boolean}
 */
function compareIgnorePatterns(local: string[], config: string[]): boolean {
    if (local.length !== config.length) {
        return false;
    }
    let localSorted = local.sort(),
        configSorted = config.sort();

    for (let x = 0; x < configSorted.length; x++) {
        if (configSorted[x] !== localSorted[x]) {
            return false;
        }
    }

    return true;
}

/**
 * Extension that manages the imports of a document. Can organize them, import a new symbol and
 * import a symbol under the cursor.
 * 
 * @export
 * @class ResolveExtension
 * @extends {BaseExtension}
 */
@injectable()
export class ResolveExtension extends BaseExtension {
    private logger: Logger;
    private statusBarItem: StatusBarItem = window.createStatusBarItem(StatusBarAlignment.Left, 4);
    private fileWatcher: FileSystemWatcher = workspace.createFileSystemWatcher(
        '{**/*.ts,**/package.json,**/typings.json}', true
    );
    private ignorePatterns: string[];

    constructor(
        @inject('LoggerFactory') loggerFactory: LoggerFactory,
        private pickProvider: ResolveQuickPickProvider,
        private parser: TsResourceParser,
        private config: ExtensionConfig,
        private index: ResolveIndex,
        private completionProvider: ResolveCompletionItemProvider
    ) {
        super();

        this.logger = loggerFactory('ResolveExtension');
        this.ignorePatterns = this.config.resolver.ignorePatterns;

        this.logger.info('Extension instantiated.');
    }

    /**
     * Returns command items for this extension.
     * 
     * @returns {CommandQuickPickItem[]}
     * 
     * @memberOf ResolveExtension
     */
    public getGuiCommands(): CommandQuickPickItem[] {
        return [
            new CommandQuickPickItem(
                'Import resolver: Add import',
                '',
                'Does open the list of unimported symbols.',
                new TshCommand(() => this.addImport())
            ),
            new CommandQuickPickItem(
                'Import resolver: Add import under cursor',
                `right now: '${this.getSymbolUnderCursor()}'`,
                'Adds the symbol under the cursor and opens a list if multiple are possible.',
                new TshCommand(() => this.addImportUnderCursor())
            ),
            new CommandQuickPickItem(
                'Import resolver: Add missing imports',
                '',
                'Adds all missing symbols to the actual document if possible.',
                new TshCommand(() => this.addMissingImports())
            ),
            new CommandQuickPickItem(
                'Import resolver: Organize imports',
                '',
                'Sorts imports and removes unused imports.',
                new TshCommand(() => this.organizeImports())
            ),
            new CommandQuickPickItem(
                'Import resolver: Rebuild cache',
                `currently: ${Object.keys(this.index.index).length} symbols`,
                'Does rebuild the whole symbol index.',
                new TshCommand(() => this.refreshIndex())
            )
        ];
    }

    /**
     * Initializes the extension.
     * 
     * @param {ExtensionContext} context
     * 
     * @memberOf ResolveExtension
     */
    public initialize(context: ExtensionContext): void {
        context.subscriptions.push(
            commands.registerTextEditorCommand('typescriptHero.resolve.addImport', () => this.addImport())
        );
        context.subscriptions.push(
            commands.registerTextEditorCommand(
                'typescriptHero.resolve.addImportUnderCursor', () => this.addImportUnderCursor()
            )
        );
        context.subscriptions.push(
            commands.registerTextEditorCommand(
                'typescriptHero.resolve.addMissingImports', () => this.addMissingImports()
            )
        );
        context.subscriptions.push(
            commands.registerTextEditorCommand('typescriptHero.resolve.organizeImports', () => this.organizeImports())
        );
        context.subscriptions.push(
            commands.registerCommand('typescriptHero.resolve.rebuildCache', () => this.refreshIndex())
        );
        context.subscriptions.push(languages.registerCompletionItemProvider('typescript', this.completionProvider));
        context.subscriptions.push(
            languages.registerCompletionItemProvider('typescriptreact', this.completionProvider)
        );
        context.subscriptions.push(this.statusBarItem);
        context.subscriptions.push(this.fileWatcher);

        this.statusBarItem.text = resolverOk;
        this.statusBarItem.tooltip = 'Click to manually reindex all files.';
        this.statusBarItem.command = 'typescriptHero.resolve.rebuildCache';
        this.statusBarItem.show();

        this.refreshIndex();

        this.fileWatcher.onDidChange(uri => {
            if (uri.fsPath.endsWith('.d.ts')) {
                return;
            }
            if (uri.fsPath.endsWith('package.json') || uri.fsPath.endsWith('typings.json')) {
                this.logger.info('package.json or typings.json modified. Refreshing index.');
                this.refreshIndex();
            } else {
                this.logger.info(`File "${uri.fsPath}" changed. Reindexing file.`);
                this.refreshIndex(uri);
            }
        });
        this.fileWatcher.onDidDelete(uri => {
            if (uri.fsPath.endsWith('.d.ts')) {
                return;
            }
            this.logger.info(`File "${uri.fsPath}" deleted. Removing file.`);
            this.index.removeForFile(uri.fsPath);
        });

        context.subscriptions.push(workspace.onDidChangeConfiguration(() => {
            if (!compareIgnorePatterns(this.ignorePatterns, this.config.resolver.ignorePatterns)) {
                this.logger.info('The typescriptHero.resolver.ignorePatterns setting was modified, reload the index.');
                this.refreshIndex();
                this.ignorePatterns = this.config.resolver.ignorePatterns;
            }
        }));

        this.logger.info('Initialized.');
    }

    /**
     * Disposes the extension.
     * 
     * 
     * @memberOf ResolveExtension
     */
    public dispose(): void {
        this.logger.info('Dispose called.');
    }

    /**
     * Add an import from the whole list. Calls the vscode gui, where the user can
     * select a symbol to import.
     * 
     * @private
     * @returns {Promise<void>}
     * 
     * @memberOf ResolveExtension
     */
    private async addImport(): Promise<void> {
        if (!this.index.indexReady) {
            this.showCacheWarning();
            return;
        }
        try {
            let newImport = await this.pickProvider.addImportPick(window.activeTextEditor.document);
            if (newImport) {
                this.logger.info('Add import to document', { resolveItem: newImport });
                this.addImportToDocument(newImport);
            }
        } catch (e) {
            this.logger.error('An error happend during import picking', e);
            window.showErrorMessage('The import cannot be completed, there was an error during the process.');
        }
    }

    /**
     * Add an import that matches the word under the actual cursor.
     * If an exact match is found, the import is added automatically. If not, the vscode gui
     * will be called with the found matches.
     * 
     * @private
     * @returns {Promise<void>}
     * 
     * @memberOf ResolveExtension
     */
    private async addImportUnderCursor(): Promise<void> {
        if (!this.index.indexReady) {
            this.showCacheWarning();
            return;
        }
        let selectedSymbol = this.getSymbolUnderCursor();
        if (!!!selectedSymbol) {
            return;
        }

        try {
            let newImport = await this.pickProvider.addImportUnderCursorPick(
                window.activeTextEditor.document, selectedSymbol
            );
            if (newImport) {
                this.logger.info('Add import to document', { resolveItem: newImport });
                this.addImportToDocument(newImport);
            }
        } catch (e) {
            this.logger.error('An error happend during import picking', e);
            window.showErrorMessage('The import cannot be completed, there was an error during the process.');
        }
    }

    /**
     * Adds all missing imports to the actual document if possible. If multiple declarations are found,
     * a quick pick list is shown to the user and he needs to decide, which import to use.
     * 
     * @private
     * @returns {Promise<void>}
     * 
     * @memberOf ResolveExtension
     */
    private async addMissingImports(): Promise<void> {
        if (!this.index.indexReady) {
            this.showCacheWarning();
            return;
        }
        try {
            let ctrl = await ImportManager.create(window.activeTextEditor.document);
            await ctrl.addMissingImports(this.index).commit();
        } catch (e) {
            this.logger.error('An error happend during import fixing', e);
            window.showErrorMessage('The operation cannot be completed, there was an error during the process.');
        }
    }

    /**
     * Organizes the imports of the actual document. Sorts and formats them correctly.
     * 
     * @private
     * @returns {Promise<boolean>}
     * 
     * @memberOf ResolveExtension
     */
    private async organizeImports(): Promise<boolean> {
        try {
            let ctrl = await ImportManager.create(window.activeTextEditor.document);
            return await ctrl.organizeImports().commit();
        } catch (e) {
            this.logger.error('An error happend during "organize imports".', { error: e });
            return false;
        }
    }

    /**
     * Effectifely adds an import quick pick item to a document
     * 
     * @private
     * @param {ResolveQuickPickItem} item
     * @returns {Promise<boolean>}
     * 
     * @memberOf ResolveExtension
     */
    private async addImportToDocument(item: ResolveQuickPickItem): Promise<boolean> {
        let ctrl = await ImportManager.create(window.activeTextEditor.document);
        return await ctrl.addDeclarationImport(item.declarationInfo).commit();
    }

    /**
     * Refresh the symbol index for a file or if the file uri is omitted, refresh the whole index.
     * 
     * @private
     * @param {Uri} [file]
     * 
     * @memberOf ResolveExtension
     */
    private async refreshIndex(file?: Uri): Promise<void> {
        this.statusBarItem.text = resolverSyncing;

        let result: boolean;

        if (file) {
            result = await this.index.rebuildForFile(file.fsPath);
        } else {
            result = await this.index.buildIndex();
        }

        this.statusBarItem.text = result ? resolverOk : resolverErr;
    }

    /**
     * Shows a user warning if the resolve index is not ready yet.
     * 
     * @private
     * 
     * @memberOf ResolveExtension
     */
    private showCacheWarning(): void {
        window.showWarningMessage('Please wait a few seconds longer until the symbol cache has been build.');
    }

    /**
     * Returns the string under the cursor.
     * 
     * @private
     * @returns {string}
     * 
     * @memberOf ResolveExtension
     */
    private getSymbolUnderCursor(): string {
        let editor = window.activeTextEditor;
        if (!editor) {
            return '';
        }
        let selection = editor.selection,
            word = editor.document.getWordRangeAtPosition(selection.active);
        return word && !word.isEmpty ? editor.document.getText(word) : '';
    }
}
