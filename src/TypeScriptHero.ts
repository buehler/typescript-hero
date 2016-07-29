import * as vscode from 'vscode';
import * as inversify from 'inversify';

const TYPESCRIPT: vscode.DocumentFilter = { language: 'typescript', scheme: 'file' };

@inversify.injectable()
export class TypeScriptHero implements vscode.Disposable {
    
    constructor(@inversify.inject('context')context: vscode.ExtensionContext) {
        console.log('Activation event called. TypeScriptHero instantiated.');

        //this.refreshSymbolCache();

        // context.subscriptions.push(vscode.commands.registerCommand('typescriptHero.refreshSymbolCache', () => this.refreshSymbolCache()));
        // context.subscriptions.push(vscode.commands.registerCommand('typescriptHero.organizeImports', () => this.organizeImports()));
        // context.subscriptions.push(vscode.commands.registerCommand('typescriptHero.addImport', () => this.addImport()));

        // if (Configuration.refreshOnSave) {
        //     vscode.workspace.onDidSaveTextDocument(event => this.refreshSymbolCache());
        // }

        // if (Configuration.organizeOnSave) {
        //     vscode.workspace.onDidSaveTextDocument(event => this.organizeImports());
        // }

        //context.subscriptions.push(vscode.languages.registerCompletionItemProvider(TYPESCRIPT, new CompletionItemProvider(this.cache), 'tsh'));
    }

    public dispose(): void {
        console.log('Deactivation event called. Disposing TypeScriptHero.');
    }

    // private refreshSymbolCache(): void {
    //     this.cache.refreshCache();
    // }

    // private organizeImports(): void {
    //     try {
    //         if (!this.cache.cacheBuilt) {
    //             this.showCacheWarning();
    //             return;
    //         }
    //         this.importManager.organizeImports();
    //     } catch (e) {
    //         Logger.instance.error('An error happend during organizeImports.', e);
    //         vscode.window.showErrorMessage('There was an error during the command.');
    //     }
    // }

    // private addImport(): void {
    //     if (!this.cache.cacheBuilt) {
    //         this.showCacheWarning();
    //         return;
    //     }
    //     this.quickPickProvider
    //         .showAddImportList()
    //         .then(selected => {
    //             try {
    //                 if (!selected) {
    //                     return;
    //                 }
    //                 this.importManager.addImport(new ImportSymbol(selected.label, selected.symbol))
    //             } catch (e) {
    //                 Logger.instance.error('An error happend during addImport.', e);
    //                 vscode.window.showErrorMessage('There was an error during the command.');
    //             }
    //         });
    // }

    // private showCacheWarning(): void {
    //     vscode.window.showWarningMessage('Please wait a few seconds longer until the symbol cache has been build.');
    // }
}
