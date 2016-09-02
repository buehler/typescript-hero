import {ResolveCache} from '../caches/ResolveCache';
import {ResolveItemFactory} from '../factories/ResolveItemFactory';
import {ResolveQuickPickItem} from '../models/ResolveQuickPickItem';
import {TsResolveFileParser} from '../parser/TsResolveFileParser';
import {Logger, LoggerFactory} from '../utilities/Logger';
import {inject, injectable} from 'inversify';
import * as vscode from 'vscode';

@injectable()
export class ResolveQuickPickProvider {
    private logger: Logger;

    constructor( @inject('LoggerFactory') loggerFactory: LoggerFactory, private cache: ResolveCache, private parser: TsResolveFileParser, private resolveItemFactory: ResolveItemFactory) {
        this.logger = loggerFactory('ResolveQuickPickProvider');
    }

    public addImportPick(openDocument: vscode.Uri, openSource: string, searchText: string = ''): Thenable<ResolveQuickPickItem> {
        return vscode.window.showQuickPick(this.buildQuickPickList(openDocument, openSource, searchText));
    }

    public buildQuickPickList(openDocument: vscode.Uri, openSource: string, search: string = ''): Thenable<ResolveQuickPickItem[]> {
        return this.parser.parseSource(openSource)
            .then(parsedSource => {
                let resolveItems = this.resolveItemFactory.getResolvableItems(this.cache.cachedFiles, openDocument, parsedSource.imports);
                if (search) {
                    resolveItems = resolveItems.filter(item => {
                        return item.declaration.name === search;
                    });
                }
                return resolveItems.map(o => new ResolveQuickPickItem(o));
            })
            .catch(error => {
                this.logger.error('Error during quick list building.', { error });
                return [];
            });
    }
}
