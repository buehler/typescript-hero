import * as vscode from 'vscode';
import {TsResolveFile} from './TsResolveFile';

export class ResolveQuickPickItem implements vscode.QuickPickItem {
    public label: string;
    public description: string;

    constructor(public resolveFile: TsResolveFile) {
        
    }
}
