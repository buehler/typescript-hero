import {SymbolCache} from './utilities/SymbolCache';
import {Logger} from './utilities/Logger';
import * as vscode from 'vscode';


export function activate(context: vscode.ExtensionContext) {
    Logger.instance.log('Activation event called.');

    SymbolCache.instance.refreshCache();

    context.subscriptions.push(vscode.commands.registerCommand('typescriptHero.refreshSymbolCache', () => {
        SymbolCache.instance.refreshCache();
    }));
}

// this method is called when your extension is deactivated
export function deactivate() {
    Logger.instance.log('Deactivation event called.');
}
