import { inject, injectable } from 'inversify';
import { resolve } from 'path';
import {
    Event,
    EventEmitter,
    ExtensionContext,
    ProviderResult,
    TreeDataProvider,
    TreeItem,
    TreeItemCollapsibleState,
    window,
    workspace,
} from 'vscode';
import { CompletionItemKind } from 'vscode-languageserver-types';

import { TypescriptParser } from '../../common/ts-parsing';
import {
    ClassDeclaration,
    Declaration,
    InterfaceDeclaration,
    VariableDeclaration,
} from '../../common/ts-parsing/declarations';
import { File } from '../../common/ts-parsing/resources';
import { Logger, LoggerFactory } from '../../common/utilities';
import { stringTemplate } from '../../common/utilities/StringTemplate';
import { iocSymbols } from '../IoCSymbols';
import { BaseExtension } from './BaseExtension';

const fileTemplate = stringTemplate`./src/extension/assets/icons/declarations/${0}.svg`;

class DeclarationTreeItem extends TreeItem {
    public get iconPath(): string | undefined {
        switch (this.declaration.itemKind) {
            case CompletionItemKind.Class:
            case CompletionItemKind.Keyword:
                return this.context.asAbsolutePath(fileTemplate('class'));
            case CompletionItemKind.Interface:
                return this.context.asAbsolutePath(fileTemplate('interface'));
            case CompletionItemKind.Enum:
                return this.context.asAbsolutePath(fileTemplate('enum'));
            case CompletionItemKind.Function:
            case CompletionItemKind.Method:
                return this.context.asAbsolutePath(fileTemplate('callable'));
            case CompletionItemKind.Module:
                return this.context.asAbsolutePath(fileTemplate('module'));
            case CompletionItemKind.Property:
                return this.context.asAbsolutePath(fileTemplate('property'));
            default:
                break;
        }

        if (this.declaration.itemKind === CompletionItemKind.Variable) {
            return (this.declaration as VariableDeclaration).isConst ?
                this.context.asAbsolutePath(fileTemplate('const')) :
                this.context.asAbsolutePath(fileTemplate('variable'));
        }

        return this.context.asAbsolutePath(fileTemplate('default'));
    }

    constructor(public declaration: Declaration, private context: ExtensionContext) {
        super(declaration.name);

        if (
            declaration instanceof ClassDeclaration ||
            declaration instanceof InterfaceDeclaration
        ) {
            this.collapsibleState = TreeItemCollapsibleState.Collapsed;
        }
    }

    public getChildren(): DeclarationTreeItem[] {
        if (
            this.declaration instanceof ClassDeclaration ||
            this.declaration instanceof InterfaceDeclaration
        ) {
            return [
                ...this.declaration.properties.map(p => new DeclarationTreeItem(p, this.context)),
                ...this.declaration.methods.map(m => new DeclarationTreeItem(m, this.context)),
            ];
        }
        return [];
    }
}

/**
 * Extension that provides code completion for typescript files. Uses the calculated index to provide information.
 * 
 * @export
 * @class DocumentSymbolStructureExtension
 * @extends {BaseExtension}
 * @implements {CompletionItemProvider}
 */
@injectable()
export class DocumentSymbolStructureExtension extends BaseExtension implements TreeDataProvider<DeclarationTreeItem> {
    public readonly onDidChangeTreeData: Event<DeclarationTreeItem | undefined>;
    private _onDidChangeTreeData: EventEmitter<DeclarationTreeItem | undefined>;
    private logger: Logger;
    private documentCache: File | undefined;

    constructor(
        @inject(iocSymbols.extensionContext) context: ExtensionContext,
        @inject(iocSymbols.loggerFactory) loggerFactory: LoggerFactory,
        private parser: TypescriptParser,
    ) {
        super(context);
        this.logger = loggerFactory('DocumentSymbolStructureExtension');
        this._onDidChangeTreeData = new EventEmitter<DeclarationTreeItem | undefined>();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
    }

    /**
     * Initialized the extension. Registers the commands and other disposables to the context.
     * 
     * @memberof DocumentSymbolStructureExtension
     */
    public initialize(): void {
        this.context.subscriptions.push(
            window.registerTreeDataProvider<DeclarationTreeItem>('documentStructure', this),
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

    public getTreeItem(element: DeclarationTreeItem): TreeItem {
        return element;
    }

    public async getChildren(element?: DeclarationTreeItem): Promise<ProviderResult<DeclarationTreeItem[]>> {
        if (!window.activeTextEditor) {
            return [];
        }

        if (!this.documentCache) {
            this.documentCache = await this.parser.parseSource(window.activeTextEditor.document.getText());
        }

        if (!element) {
            return this.documentCache.declarations.map(d => new DeclarationTreeItem(d, this.context));
        }
        return element.getChildren();
    }

    private activeWindowChanged(): void {
        this.logger.info('Active window changed or document was saved. Reparse file.');
        this.documentCache = undefined;
        this._onDidChangeTreeData.fire();
    }
}
