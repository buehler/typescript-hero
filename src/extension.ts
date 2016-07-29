import 'reflect-metadata';
import {TypeScriptHero} from './TypeScriptHero';
import {ExtensionContext, Disposable} from 'vscode';
import {Injector} from './IoC';

let extension: Disposable;

export function activate(context: ExtensionContext) {
    Injector.bind<ExtensionContext>('context').toConstantValue(context);
    extension = Injector.get(TypeScriptHero);
}

export function deactivate() {
    extension.dispose();
    extension = null;
}
