import 'reflect-metadata';
import { Disposable, ExtensionContext } from 'vscode';

let extension: Disposable;

/**
 * Activates TypeScript Hero
 * 
 * @export
 * @param {ExtensionContext} context
 */
export function activate(context: ExtensionContext): void {
    // if (Injector.isBound('context')) {
    //     Injector.unbind('context');
    // }
    // Injector.bind<ExtensionContext>('context').toConstantValue(context);
    console.log(context);
    extension = '' as any;
}

/**
 * Deactivates TypeScript Hero
 * 
 * @export
 */
export function deactivate(): void {
    // extension.dispose();
    // extension = null;
}
