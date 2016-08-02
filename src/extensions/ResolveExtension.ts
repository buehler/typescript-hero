import * as inversify from 'inversify';
import * as vscode from 'vscode';
import {ResolveCache} from '../caches/ResolveCache';
import {QuickPickProvider} from '../provider/QuickPickProvider';

@inversify.injectable()
export class ResolveExtension {
    constructor( @inversify.inject('context') context: vscode.ExtensionContext, private cache: ResolveCache, private pickProvider: QuickPickProvider) {
        console.log('ResolveExtension instantiated');

        context.subscriptions.push(vscode.commands.registerCommand('typescriptHero.addImport', () => this.addImport()));
        vscode.workspace.onDidSaveTextDocument(event => this.cache.refreshCache());
    }

    private addImport(): void {
        if (!this.cache.cacheReady) {
            this.showCacheWarning();
            return;
        }
        // filter already imported
        this.pickProvider.addImportPick(vscode.window.activeTextEditor.document.uri).then(o => {
            console.log(o);
        });
    }

    private showCacheWarning(): void {
        vscode.window.showWarningMessage('Please wait a few seconds longer until the symbol cache has been build.');
    }
}
