import 'reflect-metadata';
import { Container } from './IoC';
import { iocSymbols } from './IoCSymbols';
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
    if (Container.isBound(iocSymbols.extensionContext)) {
        Container.unbind(iocSymbols.extensionContext);
    }
    Container.bind<ExtensionContext>(iocSymbols.extensionContext).toConstantValue(context);
    extension = Container.get(TypeScriptHero);
}

/**
 * Deactivates TypeScript Hero
 * 
 * @export
 */
export function deactivate(): void {
    extension.dispose();
}
