import 'reflect-metadata';
import { Container, Symbols } from './IoC';
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
    if (Container.isBound(Symbols.extensionContext)) {
        Container.unbind(Symbols.extensionContext);
    }
    Container.bind<ExtensionContext>(Symbols.extensionContext).toConstantValue(context);
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
