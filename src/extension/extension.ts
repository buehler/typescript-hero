import 'reflect-metadata';
import '../common/transport-models';
import '../common/ts-parsing/declarations';
import '../common/ts-parsing/exports';
import '../common/ts-parsing/imports';
import '../common/ts-parsing/resources';
import { Container } from './IoC';
import { iocSymbols } from './IoCSymbols';
import { TypeScriptHero } from './TypeScriptHero';
import { ClientConnection } from './utilities/ClientConnection';
import { Disposable, ExtensionContext } from 'vscode';

let extension: Disposable;

/**
 * Activates TypeScript Hero
 * 
 * @export
 * @param {ExtensionContext} context
 */
export async function activate(context: ExtensionContext): Promise<void> {
    if (Container.isBound(iocSymbols.extensionContext)) {
        Container.unbind(iocSymbols.extensionContext);
    }
    Container.bind<ExtensionContext>(iocSymbols.extensionContext).toConstantValue(context);
    Container.bind(ClientConnection).toConstantValue(await ClientConnection.create(context));
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
