import { ResolveIndex } from '../caches/ResolveIndex';
import { DocumentController } from '../controllers/DocumentController';
import { ExtensionConfig } from '../ExtensionConfig';
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
    resolverErr = 'Resolver $(flame)',
    TYPESCRIPT = 'typescript',
    TYPESCRIPT_REACT = 'typescriptreact';

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
            commands.registerTextEditorCommand('typescriptHero.resolve.organizeImports', () => this.organizeImports())
        );
        context.subscriptions.push(
            commands.registerCommand('typescriptHero.resolve.rebuildCache', () => this.refreshIndex())
        );
        context.subscriptions.push(languages.registerCompletionItemProvider(TYPESCRIPT, this.completionProvider));
        context.subscriptions.push(languages.registerCompletionItemProvider(TYPESCRIPT_REACT, this.completionProvider));
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

    public dispose(): void {
        this.logger.info('Dispose called.');
    }

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

    private async organizeImports(): Promise<boolean> {
        try {
            let ctrl = await DocumentController.create(window.activeTextEditor.document);
            return await ctrl.organizeImports().commit();
        } catch (e) {
            this.logger.error('An error happend during "organize imports".', { error: e });
            return false;
        }
    }

    private async addImportToDocument(item: ResolveQuickPickItem): Promise<boolean> {
        let ctrl = await DocumentController.create(window.activeTextEditor.document);
        return await ctrl.addDeclarationImport(item.declarationInfo).commit();
    }

    private refreshIndex(file?: Uri): void {
        this.statusBarItem.text = resolverSyncing;

        if (file) {
            this.index.rebuildForFile(file.fsPath)
                .then(() => this.statusBarItem.text = resolverOk)
                .catch(() => this.statusBarItem.text = resolverErr);
        } else {
            this.index.buildIndex()
                .then(() => this.statusBarItem.text = resolverOk)
                .catch(() => this.statusBarItem.text = resolverErr);
        }
    }

    private showCacheWarning(): void {
        window.showWarningMessage('Please wait a few seconds longer until the symbol cache has been build.');
    }

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
