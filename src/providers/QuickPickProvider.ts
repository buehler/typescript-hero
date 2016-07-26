import {SymbolQuickPickItem} from '../models/SymbolQuickPickItem';
import {SymbolType} from '../models/TypescriptSymbol';
import {SymbolCache} from '../utilities/SymbolCache';
import * as vscode from 'vscode';

export class QuickPickProvider {
    constructor(private cache: SymbolCache) { }

    public showAddImportList(): Thenable<SymbolQuickPickItem> {
        return vscode.window
            .showQuickPick(this.buildQuickPickList());
    }

    private buildQuickPickList(): Thenable<SymbolQuickPickItem[]> {
        return new Promise((resolve, reject) => {
            let items: vscode.QuickPickItem[] = [];
            for (let symbol of this.cache.symbolCache) {
                if (symbol.type === SymbolType.Typings) {
                    items.push(new SymbolQuickPickItem(symbol.alias, symbol.library, symbol));
                } else {
                    items.push(...symbol.exports.map(o => new SymbolQuickPickItem(o, symbol.library, symbol)));
                }
            }
            resolve(items);
        });
    }
}
