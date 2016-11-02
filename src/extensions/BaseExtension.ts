import { CommandQuickPickItem } from '../models/QuickPickItems';
import { injectable } from 'inversify';
import { Disposable, ExtensionContext } from 'vscode';

/**
 * Base extension class. Does provide the basic structure of an extension.
 * 
 * @export
 * @abstract
 * @class BaseExtension
 * @implements {Disposable}
 */
@injectable()
export abstract class BaseExtension implements Disposable {

    /**
     * Returns a list of commands that are shown in the TypeScript Hero "gui".
     * 
     * @abstract
     * @returns {CommandQuickPickItem[]}
     * 
     * @memberOf BaseExtension
     */
    public abstract getGuiCommands(): CommandQuickPickItem[];

    /**
     * Initialize the extension. Should register disposables to the extension context
     * and register commands and such operations.
     * 
     * @abstract
     * @param {ExtensionContext} context
     * 
     * @memberOf BaseExtension
     */
    public abstract initialize(context: ExtensionContext): void;

    /**
     * Dispose the extension.
     * 
     * @abstract
     * 
     * @memberOf BaseExtension
     */
    public abstract dispose(): void;
}
