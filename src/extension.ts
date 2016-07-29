import 'reflect-metadata';
import {TypeScriptHero} from './TypeScriptHero';
import * as vscode from 'vscode';
import {Injector} from './IoC';

let extension: vscode.Disposable;

export function activate(context: vscode.ExtensionContext) {
    Injector.bind<vscode.ExtensionContext>('context').toConstantValue(context);
    extension = Injector.get(TypeScriptHero);
}

export function deactivate() {
    extension.dispose();
    extension = null;
}
