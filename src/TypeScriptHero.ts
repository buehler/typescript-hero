import {SymbolCache} from './utilities/SymbolCache';
import {Logger} from './utilities/Logger';
import * as vscode from 'vscode';

export class TypeScriptHero implements vscode.Disposable {
    constructor(context: vscode.ExtensionContext) {
        Logger.instance.log('Activation event called. TypeScriptHero instantiated.');

        SymbolCache.instance.refreshCache();

        context.subscriptions.push(vscode.commands.registerCommand('typescriptHero.refreshSymbolCache', () => {
            SymbolCache.instance.refreshCache();
        }));
    }

    public dispose(): void {
        Logger.instance.log('Deactivation event called. Disposing TypeScriptHero.');
    }
}
