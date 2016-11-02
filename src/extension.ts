import 'reflect-metadata';
import { Injector } from './IoC';
import { TypeScriptHero } from './TypeScriptHero';
import { Disposable, ExtensionContext } from 'vscode';

let extension: Disposable;

/**
 * Activates TypeScript Hero
 * 
 * @export
 * @param {ExtensionContext} context
 */
export function activate(context: ExtensionContext): void {
    if (Injector.isBound('context')) {
        Injector.unbind('context');
    }
    Injector.bind<ExtensionContext>('context').toConstantValue(context);
    extension = Injector.get(TypeScriptHero);
}

/**
 * Deactivates TypeScript Hero
 * 
 * @export
 */
export function deactivate(): void {
    extension.dispose();
    extension = null;
}
