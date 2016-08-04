import {ResolveCache} from '../caches/ResolveCache';
import {ResolveItemFactory} from '../factories/ResolveItemFactory';
import {ResolveQuickPickItem} from '../models/ResolveQuickPickItem';
import {TsExternalModuleImport, TsNamedImport, TsNamespaceImport} from '../models/TsImport';
import {TsResolveFileParser} from '../parser/TsResolveFileParser';
import * as inversify from 'inversify';
import * as vscode from 'vscode';

@inversify.injectable()
export class QuickPickProvider {
    constructor(private cache: ResolveCache, private parser: TsResolveFileParser, private resolveItemFactory: ResolveItemFactory) { }

    public addImportPick(openDocument: vscode.Uri, openSource: string): Thenable<ResolveQuickPickItem> {
        return vscode.window.showQuickPick(this.buildQuickPickList(openDocument, openSource));
    }

    private buildQuickPickList(openDocument: vscode.Uri, openSource: string): Thenable<ResolveQuickPickItem[]> {
        return this.parser.parseSource(openSource)
            .then(parsedSource => {
                let resolveItems = this.resolveItemFactory.getResolvableItems(this.cache.cachedFiles, openDocument);

                resolveItems = resolveItems.filter(o => o.resolveFile.fsPath !== openDocument.fsPath);
                for (let exImport of parsedSource.imports) {
                    if (exImport instanceof TsNamedImport) {
                        resolveItems = resolveItems.filter(o => o.libraryName !== exImport.libraryName || !exImport.specifiers.some(s => s.specifier === o.declaration.name));
                    } else if (exImport instanceof TsNamespaceImport || exImport instanceof TsExternalModuleImport) {
                        resolveItems = resolveItems.filter(o => o.libraryName !== exImport.libraryName);
                    }
                }

                return resolveItems.map(o => new ResolveQuickPickItem(o));
            });
    }
}
