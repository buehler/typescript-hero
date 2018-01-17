import { inject, injectable } from 'inversify';
import { Subscription } from 'rxjs';
import { File, Node, TypescriptParser } from 'typescript-parser';
import {
    commands,
    Disposable,
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

import Activatable from '../activatable';
import Configuration from '../configuration';
import iocSymbols from '../ioc-symbols';
import { Logger } from '../utilities/Logger';
import { getScriptKind } from '../utilities/utilityFunctions';
import BaseStructureTreeItem from './base-structure-tree-item';
import DeclarationStructureTreeItem from './declaration-structure-tree-item';
import DisabledStructureTreeItem from './disabled-structure-tree-item';
import { ImportsStructureTreeItem } from './imports-structure-tree-item';
import NotParseableStructureTreeItem from './not-parseable-structure-tree-item';
import ResourceStructureTreeItem from './resource-structure-tree-item';

@injectable()
export default class CodeOutline implements Activatable, TreeDataProvider<BaseStructureTreeItem> {
  private _onDidChangeTreeData: EventEmitter<BaseStructureTreeItem | undefined>;

  private subscription: Subscription;
  private disposables: Disposable[] = [];
  private documentCache?: File;

  public get onDidChangeTreeData(): Event<BaseStructureTreeItem | undefined> {
    return this._onDidChangeTreeData.event;
  }

  constructor(
    @inject(iocSymbols.extensionContext) private context: ExtensionContext,
    @inject(iocSymbols.logger) private logger: Logger,
    @inject(iocSymbols.configuration) private config: Configuration,
    @inject(iocSymbols.parser) private parser: TypescriptParser,
  ) { }

  public setup(): void {
    this.logger.debug('Setting up CodeOutline.');
    this.subscription = this.config.configurationChanged.subscribe(() => {
      if (this.config.codeOutline.isEnabled() && !this.disposables) {
        this.start();
      } else if (!this.config.codeOutline.isEnabled() && this.disposables) {
        this.stop();
      }
    });
    this.context.subscriptions.push(commands.registerCommand(
      'typescriptHero.codeOutline.gotoNode',
      (node: Node | undefined) => this.jumpToNode(node),
    ));
  }

  public start(): void {
    if (!this.config.codeOutline.isEnabled()) {
      this.logger.info(`Not starting CodeOutline. It's disabled by config.`);
      return;
    }
    this.logger.info('Starting up CodeOutline.');
    this._onDidChangeTreeData = new EventEmitter<BaseStructureTreeItem | undefined>();
    this.disposables.push(window.registerTreeDataProvider('codeOutline', this));
    this.disposables.push(this._onDidChangeTreeData);
    this.disposables.push(window.onDidChangeActiveTextEditor(() => this.activeWindowChanged()));
    this.disposables.push(workspace.onDidSaveTextDocument(() => this.activeWindowChanged()));
  }

  public stop(): void {
    if (this.config.codeOutline.isEnabled()) {
      this.logger.info(`Not stopping CodeOutline. It's enabled by config.`);
      return;
    }
    this.logger.info('Stopping CodeOutline.');
    for (const disposable of this.disposables) {
      disposable.dispose();
    }
    this.disposables = [];
  }

  public dispose(): void {
    this.logger.debug('Disposing CodeOutline.');
    if (this.subscription) {
      this.subscription.unsubscribe();
      delete this.subscription;
    }
    for (const disposable of this.disposables) {
      disposable.dispose();
    }
    this.disposables = [];
  }

  public getTreeItem(element: BaseStructureTreeItem): BaseStructureTreeItem {
    return element;
  }

  public async getChildren(element?: BaseStructureTreeItem): Promise<ProviderResult<BaseStructureTreeItem[]>> {
    if (!window.activeTextEditor) {
      return [];
    }

    if (!this.config.codeOutline.isEnabled()) {
      return [new DisabledStructureTreeItem()];
    }

    if (!this.config.parseableLanguages().some(
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
          `[CodeOutline] document could not be parsed, error: ${e}`,
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
     * Method that recalculates the current document when the active window changed.
     *
     * @private
     *
     * @memberof DocumentSymbolStructureExtension
     */
  private activeWindowChanged(): void {
    this.logger.debug('[CodeOutline] activeWindowChanged, reparsing');
    this.documentCache = undefined;
    this._onDidChangeTreeData.fire();
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
      this.logger.warn('[CodeOutline] jumpToNode used without param');
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
}
