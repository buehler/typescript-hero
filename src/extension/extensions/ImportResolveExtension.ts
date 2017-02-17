import { Notification } from '../../common/communication';
import { ClientConnection } from '../utilities/ClientConnection';
import { ExtensionConfig } from '../../common/config';
import { Logger, LoggerFactory } from '../../common/utilities';
import { iocSymbols } from '../IoCSymbols';
import { BaseExtension } from './BaseExtension';
import { existsSync } from 'fs';
import { inject, injectable } from 'inversify';
import { join } from 'path';
import { ExtensionContext, StatusBarAlignment, StatusBarItem, Uri, window, workspace } from 'vscode';

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
     * 
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
}
