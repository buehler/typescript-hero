import 'reflect-metadata';

import { ExtensionContext } from 'vscode';

import Activatable from './activatable';
import ioc from './ioc';
import iocSymbols from './ioc-symbols';
import TypescriptHero from './typescript-hero';

let extension: Activatable;

/**
 * Activates TypeScript Hero
 *
 * @export
 * @param {ExtensionContext} context
 */
export async function activate(context: ExtensionContext): Promise<void> {
  if (ioc.isBound(iocSymbols.extensionContext)) {
    ioc.unbind(iocSymbols.extensionContext);
  }
  ioc.bind<ExtensionContext>(iocSymbols.extensionContext).toConstantValue(context);

  extension = ioc.get(TypescriptHero);

  extension.setup();
  extension.start();
}

/**
 * Deactivates TypeScript Hero
 *
 * @export
 */
export function deactivate(): void {
  extension.stop();
  extension.dispose();
}
