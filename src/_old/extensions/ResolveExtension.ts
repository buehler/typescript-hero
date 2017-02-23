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
        '{**/*.ts,**/*.tsx,**/package.json,**/typings.json}', true
    );

    

    

    
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

    
   
}
