import { injectable } from 'inversify';
import { Disposable, ExtensionContext } from 'vscode';
// import { CommandQuickPickItem } from '../models/QuickPickItems';

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
     * Creates an instance of BaseExtension.
     * 
     * @param {ExtensionContext} context
     * 
     * @memberof BaseExtension
     */
    constructor(protected readonly context: ExtensionContext) { }

    /**
     * Returns a list of commands that are shown in the TypeScript Hero "gui".
     * 
     * @abstract
     * @returns {CommandQuickPickItem[]}
     * 
     * @memberof BaseExtension
     */
    // public abstract getGuiCommands(): CommandQuickPickItem[];

    /**
     * Initialize the extension. Should register disposables to the extension context
     * and register commands and such operations.
     * 
     * @abstract
     * 
     * @memberof BaseExtension
     */
    public abstract initialize(): void;

    /**
     * Dispose the extension.
     * 
     * @abstract
     * 
     * @memberof BaseExtension
     */
    public abstract dispose(): void;
}
