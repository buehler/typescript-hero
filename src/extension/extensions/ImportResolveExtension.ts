import { Notification } from '../../common/communication';
import { ExtensionConfig } from '../../common/config';
import { getDeclarationsFilteredByImports } from '../../common/helpers';
import { ResolveQuickPickItem } from '../../common/quick-pick-items';
import { ImportUserDecision } from '../../common/transport-models';
import { TypescriptParser } from '../../common/ts-parsing';
import { DeclarationInfo } from '../../common/ts-parsing/declarations';
import { Logger, LoggerFactory } from '../../common/utilities';
import { CalculatedDeclarationIndex } from '../declarations/CalculatedDeclarationIndex';
import { iocSymbols } from '../IoCSymbols';
import { ImportManager } from '../managers';
import { ClientConnection } from '../utilities/ClientConnection';
import { BaseExtension } from './BaseExtension';
import { existsSync } from 'fs';
import { inject, injectable } from 'inversify';
import { join } from 'path';
import { commands, ExtensionContext, StatusBarAlignment, StatusBarItem, Uri, window, workspace } from 'vscode';

type DeclarationsForImportOptions = { cursorSymbol: string, documentSource: string, documentPath: string };
type MissingDeclarationsForFileOptions = { documentSource: string, documentPath: string };

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
    const localSorted = local.sort();
    const configSorted = config.sort();

    for (let x = 0; x < configSorted.length; x += 1) {
        if (configSorted[x] !== localSorted[x]) {
            return false;
        }
    }

    return true;
}

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
            '{**/node_modules/**,**/typings/**}',
        ),
    ];

    let globs: string[] = [];
    let ignores = ['**/typings/**'];

    if (workspace.rootPath && existsSync(join(workspace.rootPath, 'package.json'))) {
        const packageJson = require(join(workspace.rootPath, 'package.json'));
        if (packageJson['dependencies']) {
            globs = globs.concat(
                Object.keys(packageJson['dependencies']).map(o => `**/node_modules/${o}/**/*.d.ts`),
            );
            ignores = ignores.concat(
                Object.keys(packageJson['dependencies']).map(o => `**/node_modules/${o}/node_modules/**`),
            );
        }
        if (packageJson['devDependencies']) {
            globs = globs.concat(
                Object.keys(packageJson['devDependencies']).map(o => `**/node_modules/${o}/**/*.d.ts`),
            );
            ignores = ignores.concat(
                Object.keys(packageJson['devDependencies']).map(o => `**/node_modules/${o}/node_modules/**`),
            );
        }
    } else {
        globs.push('**/node_modules/**/*.d.ts');
    }
    searches.push(
        workspace.findFiles(`{${globs.join(',')}}`, `{${ignores.join(',')}}`),
    );

    searches.push(
        workspace.findFiles('**/typings/**/*.d.ts', '**/node_modules/**'),
    );

    let uris = await Promise.all(searches);

    const excludePatterns = config.resolver.ignorePatterns;
    uris = uris.map((o, idx) => idx === 0 ?
        o.filter(
            f => f.fsPath
                .replace(workspace.rootPath, '')
                .split(/\\|\//)
                .every(p => excludePatterns.indexOf(p) < 0)) :
        o,
    );
    return uris.reduce((all, cur) => all.concat(cur), []).map(o => o.fsPath);
}

const resolverOk = 'TSH Resolver $(check)';
const resolverSyncing = 'TSH Resolver $(sync)';
const resolverErr = 'TSH Resolver $(flame)';

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
    private ignorePatterns: string[];

    constructor(
        @inject(iocSymbols.extensionContext) context: ExtensionContext,
        @inject(iocSymbols.loggerFactory) loggerFactory: LoggerFactory,
        @inject(iocSymbols.configuration) private config: ExtensionConfig,
        private index: CalculatedDeclarationIndex,
        private parser: TypescriptParser,
        private connection: ClientConnection,
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
            Notification.IndexCreationSuccessful, () => this.statusBarItem.text = resolverOk,
        );
        this.connection.onNotification(
            Notification.IndexCreationFailed, () => this.statusBarItem.text = resolverErr,
        );
        this.connection.onNotification(
            Notification.IndexCreationRunning, () => this.statusBarItem.text = resolverSyncing,
        );

        // TODO: readd add Import. 
        this.context.subscriptions.push(
            commands.registerTextEditorCommand('typescriptHero.resolve.addImport', () => this.addImport()),
        );
        this.context.subscriptions.push(
            commands.registerTextEditorCommand(
                'typescriptHero.resolve.addImportUnderCursor',
                () => this.addImportUnderCursor(),
            ),
        );
        this.context.subscriptions.push(
            commands.registerTextEditorCommand(
                'typescriptHero.resolve.addMissingImports', () => this.addMissingImports(),
            ),
        );
        this.context.subscriptions.push(
            commands.registerTextEditorCommand('typescriptHero.resolve.organizeImports', () => this.organizeImports()),
        );
        this.context.subscriptions.push(
            commands.registerCommand('typescriptHero.resolve.rebuildCache', () => this.buildIndex()),
        );

        this.context.subscriptions.push(workspace.onDidChangeConfiguration(() => {
            if (!compareIgnorePatterns(this.ignorePatterns, this.config.resolver.ignorePatterns)) {
                this.logger.info('The typescriptHero.resolver.ignorePatterns setting was modified, reload the index.');
                this.buildIndex();
                this.ignorePatterns = this.config.resolver.ignorePatterns;
            }
        }));

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
     * @memberOf ResolveExtension
     */
    private async addImport(): Promise<void> {
        if (!this.index.indexReady) {
            this.showCacheWarning();
            return;
        }
        try {
            const selectedItem = await window.showQuickPick(
                this.index.declarationInfos.map(o => new ResolveQuickPickItem(o)),
                { placeHolder: 'Add import to document:' },
            );
            if (selectedItem) {
                this.logger.info('Add import to document', { resolveItem: selectedItem });
                this.addImportToDocument(selectedItem.declarationInfo);
            }
        } catch (e) {
            this.logger.error('An error happend during import picking', e);
            window.showErrorMessage('The import cannot be completed, there was an error during the process.');
        }
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
        if (!this.index.indexReady) {
            this.showCacheWarning();
            return;
        }
        try {
            const selectedSymbol = this.getSymbolUnderCursor();
            if (!!!selectedSymbol) {
                return;
            }
            const resolveItems = await this.getDeclarationsForImport({
                cursorSymbol: selectedSymbol,
                documentSource: window.activeTextEditor.document.getText(),
                documentPath: window.activeTextEditor.document.fileName,
            });

            if (resolveItems.length < 1) {
                window.showInformationMessage(
                    `The symbol '${selectedSymbol}' was not found in the index or is already imported.`,
                );
            } else if (resolveItems.length === 1 && resolveItems[0].declaration.name === selectedSymbol) {
                this.logger.info('Add import to document', { resolveItem: resolveItems[0] });
                this.addImportToDocument(resolveItems[0]);
            } else {
                const selectedItem = await window.showQuickPick(
                    resolveItems.map(o => new ResolveQuickPickItem(o)), { placeHolder: 'Multiple declarations found:' },
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
     * Adds all missing imports to the actual document if possible. If multiple declarations are found,
     * a quick pick list is shown to the user and he needs to decide, which import to use.
     * 
     * @private
     * @returns {Promise<void>}
     * 
     * @memberOf ImportResolveExtension
     */
    private async addMissingImports(): Promise<void> {
        if (!this.index.indexReady) {
            this.showCacheWarning();
            return;
        }
        try {
            const missing = await this.getMissingDeclarationsForFile({
                documentSource: window.activeTextEditor.document.getText(),
                documentPath: window.activeTextEditor.document.fileName,
            });

            if (missing && missing.length) {
                const ctrl = await ImportManager.create(window.activeTextEditor.document);
                missing.filter(o => o instanceof DeclarationInfo).forEach(o => ctrl.addDeclarationImport(<any>o));
                await ctrl.commit();
            }
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
     * @memberOf ImportResolveExtension
     */
    private async organizeImports(): Promise<boolean> {
        try {
            const ctrl = await ImportManager.create(window.activeTextEditor.document);
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
     * @param {DeclarationInfo} declaration
     * @returns {Promise<boolean>}
     * 
     * @memberOf ImportResolveExtension
     */
    private async addImportToDocument(declaration: DeclarationInfo): Promise<boolean> {
        const ctrl = await ImportManager.create(window.activeTextEditor.document);
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
        const editor = window.activeTextEditor;
        if (!editor) {
            return '';
        }
        const selection = editor.selection;
        const word = editor.document.getWordRangeAtPosition(selection.active);

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

    /**
     * Calculates the possible imports for a given document source with a filter for the given symbol.
     * Returns a list of declaration infos that may be used for select picker or something.
     * 
     * @private
     * @param {DeclarationsForImportOptions} {cursorSymbol, documentSource, documentPath}
     * @returns {(Promise<DeclarationInfo[] | undefined>)}
     * 
     * @memberOf ImportResolveExtension
     */
    private async getDeclarationsForImport(
        { cursorSymbol, documentSource, documentPath }: DeclarationsForImportOptions,
    ): Promise<DeclarationInfo[]> {
        this.logger.info(`Calculate possible imports for document with filter "${cursorSymbol}"`);

        const parsedSource = await this.parser.parseSource(documentSource);
        const activeDocumentDeclarations = parsedSource.declarations.map(o => o.name);
        const declarations = getDeclarationsFilteredByImports(
            this.index.declarationInfos,
            documentPath,
            workspace.rootPath,
            parsedSource.imports,
        ).filter(o => o.declaration.name.startsWith(cursorSymbol));

        return [
            ...declarations.filter(o => o.from.startsWith('/')),
            ...declarations.filter(o => !o.from.startsWith('/')),
        ].filter(o => activeDocumentDeclarations.indexOf(o.declaration.name) === -1);
    }

    /**
     * Calculates the missing imports of a document. Parses the documents source and then
     * tries to resolve all possible declaration infos for the usages (used identifiers).
     * 
     * @private
     * @param {MissingDeclarationsForFileOptions} {documentSource, documentPath}
     * @returns {(Promise<(DeclarationInfo | ImportUserDecision)[]>)}
     * 
     * @memberOf ImportResolveExtension
     */
    private async getMissingDeclarationsForFile(
        { documentSource, documentPath }: MissingDeclarationsForFileOptions,
    ): Promise<(DeclarationInfo | ImportUserDecision)[]> {
        const parsedDocument = await this.parser.parseSource(documentSource);
        const missingDeclarations: (DeclarationInfo | ImportUserDecision)[] = [];
        const declarations = getDeclarationsFilteredByImports(
            this.index.declarationInfos,
            documentPath,
            workspace.rootPath,
            parsedDocument.imports,
        );

        for (const usage of parsedDocument.nonLocalUsages) {
            const foundDeclarations = declarations.filter(o => o.declaration.name === usage);
            if (foundDeclarations.length <= 0) {
                continue;
            } else if (foundDeclarations.length === 1) {
                missingDeclarations.push(foundDeclarations[0]);
            } else {
                // TODO handle decisions.
                missingDeclarations.push(...foundDeclarations.map(o => new ImportUserDecision(o, usage)));
            }
        }

        return missingDeclarations;
    }
}
