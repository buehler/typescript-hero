import { inject, injectable } from 'inversify';
import { Subscription } from 'rxjs';
import { Disposable, ProviderResult, TreeDataProvider, window } from 'vscode';

import Activatable from '../activatable';
import Configuration from '../configuration';
import iocSymbols from '../ioc-symbols';
import { Logger } from '../utilities/Logger';
import BaseStructureTreeItem from './base-structure-tree-item';
import DisabledStructureTreeItem from './disabled-structure-tree-item';
import { NotParseableStructureTreeItem } from './not-parseable-structure-tree-item';

@injectable()
export default class CodeOutline implements Activatable, TreeDataProvider<BaseStructureTreeItem> {
  private subscription: Subscription;
  private treeRegister: Disposable;

  constructor(
    @inject(iocSymbols.logger) private logger: Logger,
    @inject(iocSymbols.configuration) private config: Configuration,
  ) { }

  public setup(): void {
    this.logger.debug('Setting up DocumentOutline.');
    this.subscription = this.config.configurationChanged.subscribe(() => {
      if (this.config.codeOutline.isEnabled() && !this.treeRegister) {
        this.start();
      } else if (!this.config.codeOutline.isEnabled() && this.treeRegister) {
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
    this.treeRegister = window.registerTreeDataProvider('codeOutline', this);
  }

  public stop(): void {
    if (this.config.codeOutline.isEnabled()) {
      this.logger.debug(`Not stopping DocumentOutline. It's enabled by config.`);
      return;
    }
    this.logger.debug('Stopping DocumentOutline.');
    if (this.treeRegister) {
      this.treeRegister.dispose();
      delete this.treeRegister;
    }
  }

  public dispose(): void {
    this.logger.debug('Disposing DocumentOutline.');
    if (this.subscription) {
      this.subscription.unsubscribe();
      delete this.subscription;
    }
    if (this.treeRegister) {
      this.treeRegister.dispose();
      delete this.treeRegister;
    }
  }

  public getTreeItem(element: BaseStructureTreeItem): BaseStructureTreeItem {
    return element;
  }

  public async getChildren(_element?: BaseStructureTreeItem): Promise<ProviderResult<BaseStructureTreeItem[]>> {
    if (!window.activeTextEditor) {
      return [];
    }

    if (!this.config.codeOutline.isEnabled()) {
      return [new DisabledStructureTreeItem()];
    }

    return [new NotParseableStructureTreeItem()];

    // if (!config.resolver.resolverModeLanguages.some(
    //   lang => lang === window.activeTextEditor!.document.languageId,
    // )) {
    //   return [new NotParseableStructureTreeItem()];
    // }

    // if (!this.documentCache) {
    //   try {
    //     this.documentCache = await this.parser.parseSource(
    //       window.activeTextEditor.document.getText(),
    //       getScriptKind(window.activeTextEditor.document.fileName),
    //     );
    //   } catch (e) {
    //     this.logger.error(
    //       '[%s] document could not be parsed, error: %s',
    //       DocumentSymbolStructureExtension.name,
    //       e,
    //     );
    //     return [];
    //   }
    // }

    // if (!element) {
    //   const items: BaseStructureTreeItem[] = [];
    //   if (this.documentCache.imports && this.documentCache.imports.length) {
    //     items.push(new ImportsStructureTreeItem(this.documentCache, this.context));
    //   }
    //   items.push(...this.documentCache.resources.map(r => new ResourceStructureTreeItem(r, this.context)));
    //   items.push(...this.documentCache.declarations.map(d => new DeclarationStructureTreeItem(d, this.context)));
    //   return items;
    // }
    // return element.getChildren();
  }
}
