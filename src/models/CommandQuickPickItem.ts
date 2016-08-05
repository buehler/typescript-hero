import {TshCommand} from './TshCommand';
import {QuickPickItem} from 'vscode';

export class CommandQuickPickItem implements QuickPickItem {
    constructor(public label: string, public description: string, public detail: string, public command: TshCommand) { }
}
