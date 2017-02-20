import { Notification, Request } from '../../common/communication';
import { ExtensionConfig } from '../../common/config';
import { ResolveQuickPickItem } from '../../common/quick-pick-items';
import { DeclarationInfo } from '../../common/ts-parsing/declarations';
import { Logger, LoggerFactory } from '../../common/utilities';
import { iocSymbols } from '../IoCSymbols';
import { ImportManager } from '../managers';
import { ClientConnection } from '../utilities/ClientConnection';
import { BaseExtension } from './BaseExtension';
import { existsSync } from 'fs';
import { inject, injectable } from 'inversify';
import { join } from 'path';
import { commands, ExtensionContext, StatusBarAlignment, StatusBarItem, Uri, window, workspace } from 'vscode';

/**
 * Search for typescript / typescript react files in the workspace and return the path to them.
 * This is needed for the initial load of the index.
 * 
 * @export
 * @param {ExtensionConfig} config
 * @returns {Promise<string[]>}
 */
export async function findFiles(config: ExtensionConfig): Promise<string[]> {
    const searches: PromiseLike<Uri[]>[] = [
        workspace.findFiles(
            '{**/*.ts,**/*.tsx}',
            '{**/node_modules/**,**/typings/**}'
        )
    ];

    let globs: string[] = [],
        ignores = ['**/typings/**'];

    if (workspace.rootPath && existsSync(join(workspace.rootPath, 'package.json'))) {
        const packageJson = require(join(workspace.rootPath, 'package.json'));
        if (packageJson['dependencies']) {
            globs = globs.concat(
                Object.keys(packageJson['dependencies']).map(o => `**/node_modules/${o}/**/*.d.ts`)
            );
            ignores = ignores.concat(
                Object.keys(packageJson['dependencies']).map(o => `**/node_modules/${o}/node_modules/**`)
            );
        }
        if (packageJson['devDependencies']) {
            globs = globs.concat(
                Object.keys(packageJson['devDependencies']).map(o => `**/node_modules/${o}/**/*.d.ts`)
            );
            ignores = ignores.concat(
                Object.keys(packageJson['devDependencies']).map(o => `**/node_modules/${o}/node_modules/**`)
            );
        }
    } else {
        globs.push('**/node_modules/**/*.d.ts');
    }
    searches.push(
        workspace.findFiles(`{${globs.join(',')}}`, `{${ignores.join(',')}}`)
    );

    searches.push(
        workspace.findFiles('**/typings/**/*.d.ts', '**/node_modules/**')
    );

    let uris = await Promise.all(searches);

    const excludePatterns = config.resolver.ignorePatterns;
    uris = uris.map((o, idx) => idx === 0 ?
        o.filter(
            f => f.fsPath
                .replace(workspace.rootPath, '')
                .split(/\\|\//)
                .every(p => excludePatterns.indexOf(p) < 0)) :
        o
    );
    return uris.reduce((all, cur) => all.concat(cur), []).map(o => o.fsPath);
}

const resolverOk = 'TSH Resolver $(check)',
    resolverSyncing = 'TSH Resolver $(sync)',
    resolverErr = 'TSH Resolver $(flame)';

/**
 * Extension that resolves imports. Contains various actions to add imports to a document, add missing
 * imports and organize imports. Also can rebuild the symbol cache.
 * 
 * @export
 * @class ImportResolveExtension
 * @extends {BaseExtension}
 */
@injectable()
export class ImportResolveExtension extends BaseExtension {
    private logger: Logger;
    private statusBarItem: StatusBarItem = window.createStatusBarItem(StatusBarAlignment.Left, 4);

    constructor(
        @inject(iocSymbols.extensionContext) context: ExtensionContext,
        @inject(iocSymbols.loggerFactory) loggerFactory: LoggerFactory,
        @inject(iocSymbols.configuration) private config: ExtensionConfig,
        private connection: ClientConnection
    ) {
        super(context);
        this.logger = loggerFactory('ImportResolveExtension');
    }

    /**
     * Initialized the extension. Registers the commands and other disposables to the context.
     * 
     * @memberOf ImportResolveExtension
     */
    public initialize(): void {
        this.context.subscriptions.push(this.statusBarItem);
        this.statusBarItem.text = resolverOk;
        this.statusBarItem.tooltip = 'Click to manually reindex all files.';
        this.statusBarItem.command = 'typescriptHero.resolve.rebuildCache';
        this.statusBarItem.show();

        this.connection.onNotification(
            Notification.IndexCreationSuccessful, () => this.statusBarItem.text = resolverOk
        );
        this.connection.onNotification(
            Notification.IndexCreationFailed, () => this.statusBarItem.text = resolverErr
        );
        this.connection.onNotification(
            Notification.IndexCreationRunning, () => this.statusBarItem.text = resolverSyncing
        );

        this.context.subscriptions.push(
            commands.registerTextEditorCommand(
                'typescriptHero.resolve.addImportUnderCursor',
                () => this.addImportUnderCursor()
            )
        );

        this.buildIndex();

        this.logger.info('Initialized');
    }

    /**
     * Disposes the extension.
     * 
     * @memberOf ImportResolveExtension
     */
    public dispose(): void {
        this.logger.info('Disposed');
    }

    /**
     * Instructs the tsh-server to build an index for the found files (actually searches for all files in the
     * current workspace).
     * 
     * @private
     * @returns {Promise<void>}
     * 
     * @memberOf ImportResolveExtension
     */
    private async buildIndex(): Promise<void> {
        this.statusBarItem.text = resolverSyncing;

        const files = await findFiles(this.config);
        this.connection.sendNotification(Notification.CreateIndexForFiles, files);
    }

    /**
     * Add an import from the whole list. Calls the vscode gui, where the user can
     * select a symbol to import.
     * 
     * @private
     * @returns {Promise<void>}
     * 
     * @memberOf ImportResolveExtension
     */
    private async addImportUnderCursor(): Promise<void> {
        if (!(await this.connection.sendRequest<boolean>(Request.DeclarationIndexReady))) {
            this.showCacheWarning();
            return;
        }
        try {
            const selectedSymbol = this.getSymbolUnderCursor();
            if (!!!selectedSymbol) {
                return;
            }
            const resolveItems = await this.connection.sendSerializedRequest<DeclarationInfo[]>(
                Request.DeclarationInfosForImport, {
                    cursorSymbol: selectedSymbol,
                    documentSource: window.activeTextEditor.document.getText(),
                    documentPath: window.activeTextEditor.document.fileName
                }
            );

            if (resolveItems.length < 1) {
                window.showInformationMessage(
                    `The symbol '${selectedSymbol}' was not found in the index or is already imported.`
                );
            } else if (resolveItems.length === 1 && resolveItems[0].declaration.name === selectedSymbol) {
                this.logger.info('Add import to document', { resolveItem: resolveItems[0] });
                this.addImportToDocument(resolveItems[0]);
            } else {
                const selectedItem = await window.showQuickPick(
                    resolveItems.map(o => new ResolveQuickPickItem(o)), { placeHolder: 'Multiple declarations found:' }
                );
                if (selectedItem) {
                    this.logger.info('Add import to document', { resolveItem: selectedItem });
                    this.addImportToDocument(selectedItem.declarationInfo);
                }
            }
        } catch (e) {
            this.logger.error('An error happend during import picking', e);
            window.showErrorMessage('The import cannot be completed, there was an error during the process.');
        }
    }

    /**
     * Effectifely adds an import quick pick item to a document
     * 
     * @private
     * @param {DeclarationInfo} declaration
     * @returns {Promise<boolean>}
     * 
     * @memberOf ImportResolveExtension
     */
    private async addImportToDocument(declaration: DeclarationInfo): Promise<boolean> {
        let ctrl = await ImportManager.create(window.activeTextEditor.document);
        return await ctrl.addDeclarationImport(declaration).commit();
    }

    /**
     * Returns the string under the cursor.
     * 
     * @private
     * @returns {string}
     * 
     * @memberOf ImportResolveExtension
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

    /**
     * Shows a user warning if the resolve index is not ready yet.
     * 
     * @private
     * 
     * @memberOf ImportResolveExtension
     */
    private showCacheWarning(): void {
        window.showWarningMessage('Please wait a few seconds longer until the symbol cache has been build.');
    }
}
