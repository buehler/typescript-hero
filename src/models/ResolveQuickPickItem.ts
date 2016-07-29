import * as vscode from 'vscode';
import {ResolveItem} from './ResolveItem';

export class ResolveQuickPickItem implements vscode.QuickPickItem {
    public label: string;
    public description: string;

    constructor(public resolveItem: ResolveItem) {

    }
}
