import { inject, injectable } from 'inversify';
import { File, Node, TypescriptParser } from 'typescript-parser';
import {
    commands,
    Event,
    EventEmitter,
    ExtensionContext,
    ProviderResult,
    Selection,
    TextEditorRevealType,
    TreeDataProvider,
    window,
    workspace,
} from 'vscode';

import { ConfigFactory } from '../../common/factories';
import { iocSymbols } from '../IoCSymbols';
import { BaseStructureTreeItem } from '../provider-items/document-structure/BaseStructureTreeItem';
import { DeclarationStructureTreeItem } from '../provider-items/document-structure/DeclarationStructureTreeItem';
import { DisabledStructureTreeItem } from '../provider-items/document-structure/DisabledStructureTreeItem';
import { ImportsStructureTreeItem } from '../provider-items/document-structure/ImportsStructureTreeItem';
import { NotParseableStructureTreeItem } from '../provider-items/document-structure/NotParseableStructureTreeItem';
import { ResourceStructureTreeItem } from '../provider-items/document-structure/ResourceStructureTreeItem';
import { getScriptKind } from '../utilities/utilityFunctions';
import { Logger } from '../utilities/winstonLogger';
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
    private documentCache: File | undefined;

    constructor(
        @inject(iocSymbols.extensionContext) context: ExtensionContext,
        @inject(iocSymbols.logger) private logger: Logger,
        @inject(iocSymbols.configuration) private config: ConfigFactory,
        @inject(iocSymbols.typescriptParser) private parser: TypescriptParser,
    ) {
        super(context);
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

        this.logger.info('[%s] initialized', DocumentSymbolStructureExtension.name);
    }

    /**
     * Disposes the extension.
     *
     * @memberof DocumentSymbolStructureExtension
     */
    public dispose(): void {
        this.logger.info('[%s] disposed', DocumentSymbolStructureExtension.name);
    }

    public getTreeItem(element: BaseStructureTreeItem): BaseStructureTreeItem {
        return element;
    }

    public async getChildren(element?: BaseStructureTreeItem): Promise<ProviderResult<BaseStructureTreeItem[]>> {
        if (!window.activeTextEditor) {
            return [];
        }

        const config = this.config(window.activeTextEditor.document.uri);

        if (!config.codeOutline.outlineEnabled) {
            return [new DisabledStructureTreeItem()];
        }

        if (!config.resolver.resolverModeLanguages.some(
            lang => lang === window.activeTextEditor!.document.languageId,
        )) {
            return [new NotParseableStructureTreeItem()];
        }

        if (!this.documentCache) {
            try {
                this.documentCache = await this.parser.parseSource(
                    window.activeTextEditor.document.getText(),
                    getScriptKind(window.activeTextEditor.document.fileName),
                );
            } catch (e) {
                this.logger.error(
                    '[%s] document could not be parsed, error: %s',
                    DocumentSymbolStructureExtension.name,
                    e,
                );
                return [];
            }
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

    /**
     * Takes a node (or undefined) and jumps to the nodes location. If undefined is passed, a warning message is displayed.
     *
     * @private
     * @param {(Node | undefined)} node
     * @returns {Promise<void>}
     *
     * @memberof DocumentSymbolStructureExtension
     */
    private async jumpToNode(node: Node | undefined): Promise<void> {
        if (!node) {
            this.logger.warn('[%s] jumpToNode used without param', DocumentSymbolStructureExtension.name);
            window.showWarningMessage('This command is for internal use only. It cannot be used from Cmd+P');
            return;
        }

        if (!window.activeTextEditor || node.start === undefined) {
            return;
        }

        const newPosition = window.activeTextEditor.document.positionAt(node.start);
        window.activeTextEditor.selection = new Selection(newPosition, newPosition);
        window.activeTextEditor.revealRange(window.activeTextEditor.selection, TextEditorRevealType.InCenter);
        await window.showTextDocument(window.activeTextEditor.document);
    }

    /**
     * Method that recalculates the current document when the active window changed.
     *
     * @private
     *
     * @memberof DocumentSymbolStructureExtension
     */
    private activeWindowChanged(): void {
        this.logger.debug('[%s] activeWindowChanged, reparsing', DocumentSymbolStructureExtension.name);
        this.documentCache = undefined;
        this._onDidChangeTreeData.fire();
    }
}
