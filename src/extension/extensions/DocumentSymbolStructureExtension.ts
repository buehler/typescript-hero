import { inject, injectable } from 'inversify';
import { Event, EventEmitter, ExtensionContext, ProviderResult, TreeDataProvider, window, workspace } from 'vscode';

import { TypescriptParser } from '../../common/ts-parsing';
import { File } from '../../common/ts-parsing/resources';
import { Logger, LoggerFactory } from '../../common/utilities';
import { iocSymbols } from '../IoCSymbols';
import { BaseStructureTreeItem } from '../provider-items/document-structure/BaseStructureTreeItem';
import { DeclarationStructureTreeItem } from '../provider-items/document-structure/DeclarationStructureTreeItem';
import { ImportsStructureTreeItem } from '../provider-items/document-structure/ImportsStructureTreeItem';
import { NotParseableStructureTreeItem } from '../provider-items/document-structure/NotParseableStructureTreeItem';
import { BaseExtension } from './BaseExtension';

/**
 * Extension that provides code completion for typescript files. Uses the calculated index to provide information.
 * 
 * @export
 * @class DocumentSymbolStructureExtension
 * @extends {BaseExtension}
 * @implements {CompletionItemProvider}
 */
@injectable()
export class DocumentSymbolStructureExtension extends BaseExtension implements TreeDataProvider<BaseStructureTreeItem> {
    public readonly onDidChangeTreeData: Event<BaseStructureTreeItem | undefined>;
    private _onDidChangeTreeData: EventEmitter<BaseStructureTreeItem | undefined>;
    private logger: Logger;
    private documentCache: File | undefined;

    constructor(
        @inject(iocSymbols.extensionContext) context: ExtensionContext,
        @inject(iocSymbols.loggerFactory) loggerFactory: LoggerFactory,
        private parser: TypescriptParser,
    ) {
        super(context);
        this.logger = loggerFactory('DocumentSymbolStructureExtension');
        this._onDidChangeTreeData = new EventEmitter<BaseStructureTreeItem | undefined>();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
    }

    /**
     * Initialized the extension. Registers the commands and other disposables to the context.
     * 
     * @memberof DocumentSymbolStructureExtension
     */
    public initialize(): void {
        this.context.subscriptions.push(
            window.registerTreeDataProvider<BaseStructureTreeItem>('documentCodeOutline', this),
        );
        this.context.subscriptions.push(this._onDidChangeTreeData);
        this.context.subscriptions.push(window.onDidChangeActiveTextEditor(() => this.activeWindowChanged()));
        this.context.subscriptions.push(workspace.onDidSaveTextDocument(() => this.activeWindowChanged()));

        this.logger.info('Initialized');
    }

    /**
     * Disposes the extension.
     * 
     * @memberof DocumentSymbolStructureExtension
     */
    public dispose(): void {
        this.logger.info('Disposed');
    }

    public getTreeItem(element: BaseStructureTreeItem): BaseStructureTreeItem {
        return element;
    }

    public async getChildren(element?: BaseStructureTreeItem): Promise<ProviderResult<BaseStructureTreeItem[]>> {
        if (
            !window.activeTextEditor ||
            !['typescript', 'typescriptreact'].some(lang => lang === window.activeTextEditor!.document.languageId)
        ) {
            return [new NotParseableStructureTreeItem()];
        }

        if (!this.documentCache) {
            this.documentCache = await this.parser.parseSource(window.activeTextEditor.document.getText());
        }

        if (!element) {
            const items: BaseStructureTreeItem[] = [];
            if (this.documentCache.imports && this.documentCache.imports.length) {
                items.push(new ImportsStructureTreeItem(this.documentCache, this.context));
            }
            return items.concat(
                this.documentCache.declarations.map(d => new DeclarationStructureTreeItem(d, this.context)),
            );
        }
        return element.getChildren();
    }

    private activeWindowChanged(): void {
        this.logger.info('Active window changed or document was saved. Reparse file.');
        this.documentCache = undefined;
        this._onDidChangeTreeData.fire();
    }
}
