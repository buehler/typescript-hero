import { inject, injectable } from 'inversify';
import { Subscription } from 'rxjs';
import { File, TypescriptParser } from 'typescript-parser';
import {
  Disposable,
  Event,
  EventEmitter,
  ExtensionContext,
  ProviderResult,
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
    this.logger.debug('Setting up DocumentOutline.');
    this.subscription = this.config.configurationChanged.subscribe(() => {
      if (this.config.codeOutline.isEnabled() && !this.disposables) {
        this.start();
      } else if (!this.config.codeOutline.isEnabled() && this.disposables) {
        this.stop();
      }
    });
  }

  public start(): void {
    if (!this.config.codeOutline.isEnabled()) {
      this.logger.debug(`Not starting DocumentOutline. It's disabled by config.`);
      return;
    }
    this.logger.debug('Starting up DocumentOutline.');
    this._onDidChangeTreeData = new EventEmitter<BaseStructureTreeItem | undefined>();
    this.disposables.push(window.registerTreeDataProvider('codeOutline', this));
    this.context.subscriptions.push(this._onDidChangeTreeData);
    this.context.subscriptions.push(window.onDidChangeActiveTextEditor(() => this.activeWindowChanged()));
    this.context.subscriptions.push(workspace.onDidSaveTextDocument(() => this.activeWindowChanged()));
  }

  public stop(): void {
    if (this.config.codeOutline.isEnabled()) {
      this.logger.debug(`Not stopping DocumentOutline. It's enabled by config.`);
      return;
    }
    this.logger.debug('Stopping DocumentOutline.');
    for (const disposable of this.disposables) {
      disposable.dispose();
    }
    this.disposables = [];
  }

  public dispose(): void {
    this.logger.debug('Disposing DocumentOutline.');
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
          `[DocumentOutline] document could not be parsed, error: ${e}`,
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
    this.logger.debug('[DocumentOutline] activeWindowChanged, reparsing');
    this.documentCache = undefined;
    this._onDidChangeTreeData.fire();
  }
}
