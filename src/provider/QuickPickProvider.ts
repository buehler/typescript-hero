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
            resolve(this.resolveItemFactory.getResolvableItems(this.cache.cachedFiles).map(o => new ResolveQuickPickItem(o)));
        });
    }
}
