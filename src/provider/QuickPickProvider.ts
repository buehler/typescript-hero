import * as vscode from 'vscode';
import {ResolveCache} from '../caches/ResolveCache';
import {ResolveQuickPickItem} from '../models/ResolveQuickPickItem';
import * as inversify from 'inversify';
import {ResolveItemFactory} from '../factories/ResolveItemFactory';

@inversify.injectable()
export class QuickPickProvider {
    constructor(private cache: ResolveCache, private resolveItemFactory: ResolveItemFactory) { }

    public addImportPick(): Thenable<ResolveQuickPickItem> {
        return vscode.window.showQuickPick(this.buildQuickPickList());
    }

    private buildQuickPickList(): Thenable<ResolveQuickPickItem[]> {
        return new Promise((resolve, reject) => {
            let items: vscode.QuickPickItem[] = [];

            for (let item of this.resolveItemFactory.getExportedDeclarations(this.cache.cachedFiles)) {
                console.log(item);
            }            

            // for (let symbol of this.cache.symbolCache) {
            //     if (symbol.type === SymbolType.Typings) {
            //         items.push(new SymbolQuickPickItem(symbol.alias, symbol.library, symbol));
            //     } else {
            //         items.push(...symbol.exports.map(o => new SymbolQuickPickItem(o, symbol.library, symbol)));
            //     }
            // }
            resolve(items);
        });
    }
}
