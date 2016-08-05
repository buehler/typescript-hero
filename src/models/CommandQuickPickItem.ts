import {QuickPickItem} from 'vscode';

export class CommandQuickPickItem implements QuickPickItem {
    public label: string;
    public description: string;
}
