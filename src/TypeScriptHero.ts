import {SymbolCache} from './utilities/SymbolCache';
import {Logger} from './utilities/Logger';
import * as vscode from 'vscode';

export class TypeScriptHero implements vscode.Disposable {
    private cache: SymbolCache = new SymbolCache();

    constructor(context: vscode.ExtensionContext) {
        Logger.instance.log('Activation event called. TypeScriptHero instantiated.');

        this.refreshSymbolCache();

        context.subscriptions.push(vscode.commands.registerCommand('typescriptHero.refreshSymbolCache', () => this.refreshSymbolCache()));
        context.subscriptions.push(vscode.commands.registerCommand('typescriptHero.organizeImports', () => this.organizeImports()));
        context.subscriptions.push(vscode.commands.registerCommand('typescriptHero.addImport', () => this.addImport()));
    }

    public dispose(): void {
        Logger.instance.log('Deactivation event called. Disposing TypeScriptHero.');
    }

    private refreshSymbolCache(): void {
        this.cache.refreshCache();
    }

    private organizeImports(): void {
        if (!this.cache.cacheBuilt) {
            this.showCacheWarning();
            return;
        }
    }

    private addImport(): void {
        if (!this.cache.cacheBuilt) {
            this.showCacheWarning();
            return;
        }
    }

    private showCacheWarning(): void {
        vscode.window.showWarningMessage('Please wait a few seconds longer until the symbol cache has been build.');
    }
}
