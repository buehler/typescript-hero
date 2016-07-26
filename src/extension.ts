import {TypeScriptHero} from './TypeScriptHero';
import * as vscode from 'vscode';

let extension: vscode.Disposable;

export function activate(context: vscode.ExtensionContext) {
    extension = new TypeScriptHero(context);
}

export function deactivate() {
    extension.dispose();
    extension = null;
}
