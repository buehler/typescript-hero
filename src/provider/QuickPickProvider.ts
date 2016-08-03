import * as vscode from 'vscode';
import {ResolveCache} from '../caches/ResolveCache';
import {ResolveQuickPickItem} from '../models/ResolveQuickPickItem';
import * as inversify from 'inversify';
import * as path from 'path';
import {ResolveItemFactory} from '../factories/ResolveItemFactory';
import {TsNamespaceImport, TsNamedImport, TsExternalModuleImport} from '../models/TsImport';

@inversify.injectable()
export class QuickPickProvider {
    constructor(private cache: ResolveCache, private resolveItemFactory: ResolveItemFactory) { }

    public addImportPick(openDocument?: vscode.Uri): Thenable<ResolveQuickPickItem> {
        return vscode.window.showQuickPick(this.buildQuickPickList(openDocument));
    }

    private buildQuickPickList(openDocument?: vscode.Uri): Thenable<ResolveQuickPickItem[]> {
        return new Promise((resolve, reject) => {
            let resolveItems = this.resolveItemFactory.getResolvableItems(this.cache.cachedFiles, openDocument);

            if (openDocument) {
                resolveItems = resolveItems.filter(o => o.resolveFile.fsPath !== openDocument.fsPath);
                let exclude = this.cache.getResolveFileForPath(openDocument);
                if (exclude) {
                    for (let exImport of exclude.imports) {
                        if (exImport instanceof TsNamedImport) {
                            resolveItems = resolveItems.filter(o => o.libraryName !== exImport.libraryName || !exImport.specifiers.some(s => s.specifier === o.declaration.name));
                        } else if (exImport instanceof TsNamespaceImport || exImport instanceof TsExternalModuleImport) {
                            resolveItems = resolveItems.filter(o => o.libraryName !== exImport.libraryName);
                        }
                    }
                }
            }

            resolve(resolveItems.map(o => new ResolveQuickPickItem(o)));
        });
    }
}
