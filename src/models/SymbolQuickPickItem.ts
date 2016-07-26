import {TypescriptSymbol} from './TypescriptSymbol';
import * as vscode from 'vscode';

export class SymbolQuickPickItem implements vscode.QuickPickItem {

    constructor(public label: string, public description: string, public symbol: TypescriptSymbol) { }
}
