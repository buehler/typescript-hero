import {ImportSymbol} from './models/ImportSymbol';
import {ImportManager} from './utilities/ImportManager';
import {QuickPickProvider} from './providers/QuickPickProvider';
import {SymbolCache} from './utilities/SymbolCache';
import {Logger} from './utilities/Logger';
import {Configuration} from './utilities/Configuration';
import * as vscode from 'vscode';

const TYPESCRIPT: vscode.DocumentFilter = { language: 'typescript', pattern: '*.ts', scheme: 'file' };

export class TypeScriptHero implements vscode.Disposable {
    private cache = new SymbolCache();
    private quickPickProvider = new QuickPickProvider(this.cache);
    private importManager = new ImportManager(this.cache);

    constructor(context: vscode.ExtensionContext) {
        Logger.instance.log('Activation event called. TypeScriptHero instantiated.');

        this.refreshSymbolCache();

        context.subscriptions.push(vscode.commands.registerCommand('typescriptHero.refreshSymbolCache', () => this.refreshSymbolCache()));
        context.subscriptions.push(vscode.commands.registerCommand('typescriptHero.organizeImports', () => this.organizeImports()));
        context.subscriptions.push(vscode.commands.registerCommand('typescriptHero.addImport', () => this.addImport()));

        if (Configuration.refreshOnSave) {
            vscode.workspace.onDidSaveTextDocument(event => this.refreshSymbolCache());
        }

        if (Configuration.organizeOnSave) {
            vscode.workspace.onDidSaveTextDocument(event => this.organizeImports());
        }
        //context.subscriptions.push(vscode.languages.registerCompletionItemProvider(TYPESCRIPT, new CompletionItemProvider(this.cache)));
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
        this.importManager.organizeImports();
    }

    private addImport(): void {
        if (!this.cache.cacheBuilt) {
            this.showCacheWarning();
            return;
        }
        this.quickPickProvider
            .showAddImportList()
            .then(selected => this.importManager.addImport(new ImportSymbol(selected.label, selected.symbol)));
    }

    private showCacheWarning(): void {
        vscode.window.showWarningMessage('Please wait a few seconds longer until the symbol cache has been build.');
    }
}
