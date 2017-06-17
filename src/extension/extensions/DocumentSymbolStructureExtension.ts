import { inject, injectable } from 'inversify';
import {
    commands,
    Event,
    EventEmitter,
    ExtensionContext,
    ProviderResult,
    Selection,
    TreeDataProvider,
    window,
    workspace,
} from 'vscode';

import { ExtensionConfig } from '../../common/config';
import { Node, TypescriptParser } from '../../common/ts-parsing';
import { File } from '../../common/ts-parsing/resources';
import { Logger, LoggerFactory } from '../../common/utilities';
import { iocSymbols } from '../IoCSymbols';
import { BaseStructureTreeItem } from '../provider-items/document-structure/BaseStructureTreeItem';
import { DeclarationStructureTreeItem } from '../provider-items/document-structure/DeclarationStructureTreeItem';
import { DisabledStructureTreeItem } from '../provider-items/document-structure/DisabledStructureTreeItem';
import { ImportsStructureTreeItem } from '../provider-items/document-structure/ImportsStructureTreeItem';
import { NotParseableStructureTreeItem } from '../provider-items/document-structure/NotParseableStructureTreeItem';
import { ResourceStructureTreeItem } from '../provider-items/document-structure/ResourceStructureTreeItem';
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
        @inject(iocSymbols.configuration) private config: ExtensionConfig,
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
        this.context.subscriptions.push(commands.registerCommand(
            'typescriptHero.documentCodeOutline.gotoNode',
            (node: Node | undefined) => this.jumpToNode(node),
        ));
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
        if (!this.config.codeOutline.outlineEnabled) {
            return [new DisabledStructureTreeItem()];
        }

        if (!window.activeTextEditor) {
            return [];
        }

        if (!['typescript', 'typescriptreact'].some(lang => lang === window.activeTextEditor!.document.languageId)) {
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
            items.push(...this.documentCache.resources.map(r => new ResourceStructureTreeItem(r, this.context)));
            items.push(...this.documentCache.declarations.map(d => new DeclarationStructureTreeItem(d, this.context)));
            return items;
        }
        return element.getChildren();
    }

    private async jumpToNode(node: Node | undefined): Promise<void> {
        if (!node) {
            window.showWarningMessage('This command is for internal use only. It cannot be used from Cmd+P');
            return;
        }

        if (!window.activeTextEditor || node.start === undefined) {
            return;
        }

        const newPosition = window.activeTextEditor.document.positionAt(node.start);
        window.activeTextEditor.selection = new Selection(newPosition, newPosition);
        window.showTextDocument(window.activeTextEditor.document);
    }

    /**
     * TODO
     * 
     * @private
     * 
     * @memberof DocumentSymbolStructureExtension
     */
    private activeWindowChanged(): void {
        this.logger.info('Active window changed or document was saved. Reparse file.');
        this.documentCache = undefined;
        this._onDidChangeTreeData.fire();
    }
}
