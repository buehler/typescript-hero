import { DeclarationInfo } from '../caches/ResolveIndex';
import { TshCommand } from './TshCommand';
import { QuickPickItem } from 'vscode';

/**
 * Quickpick item that contains a typescript hero command that can be executed.
 * Those commands help executing tasks from the "gui" or from parts of the extension.
 * 
 * @export
 * @class CommandQuickPickItem
 * @implements {QuickPickItem}
 */
export class CommandQuickPickItem implements QuickPickItem {
    constructor(public label: string, public description: string, public detail: string, public command: TshCommand) { }
}

/**
 * Quickpick item that contains a symbol resolve information (Declarationinfo)
 * Contains the name and the location where it is imported from.
 * The whole DeclarationInfo is also exposed.
 * 
 * @export
 * @class ResolveQuickPickItem
 * @implements {QuickPickItem}
 */
export class ResolveQuickPickItem implements QuickPickItem {
    public label: string;
    public description: string;

    constructor(public readonly declarationInfo: DeclarationInfo) {
        this.description = this.declarationInfo.from;
        this.label = this.declarationInfo.declaration.name;
    }
}
