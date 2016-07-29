import * as inversify from 'inversify';
import * as vscode from 'vscode';
import {ResolveCache} from '../caches/ResolveCache';

@inversify.injectable()
export class ResolveExtension {
    constructor( @inversify.inject('context') context: vscode.ExtensionContext, private cache: ResolveCache) {
        console.log('ResolveExtension instantiated');

        context.subscriptions.push(vscode.commands.registerCommand('typescriptHero.addImport', () => this.addImport()));
        vscode.workspace.onDidSaveTextDocument(event => this.cache.refreshCache());
    }

    private addImport(): void{
        if (!this.cache.cacheReady) {
            this.showCacheWarning();
            return;
        }
    }

    private showCacheWarning(): void {
        vscode.window.showWarningMessage('Please wait a few seconds longer until the symbol cache has been build.');
    }
}
