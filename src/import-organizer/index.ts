import { inject, injectable } from 'inversify';
import { DeclarationInfo } from 'typescript-parser';
import { commands, ExtensionContext, window, workspace } from 'vscode';

import Activatable from '../activatable';
import Configuration from '../configuration';
import DeclarationManager from '../declarations/declaration-manager';
import iocSymbols, { ImportManagerProvider } from '../ioc-symbols';
import { Logger } from '../utilities/logger';
import ImportQuickPickItem from './import-quick-pick-item';

@injectable()
export default class ImportOrganizer implements Activatable {
  constructor(
    @inject(iocSymbols.extensionContext) private context: ExtensionContext,
    @inject(iocSymbols.logger) private logger: Logger,
    @inject(iocSymbols.configuration) private config: Configuration,
    @inject(iocSymbols.importManager) private importManagerProvider: ImportManagerProvider,
    @inject(iocSymbols.declarationManager) private declarationManager: DeclarationManager,
  ) { }

  public setup(): void {
    this.logger.debug('Setting up ImportOrganizer.');
    this.context.subscriptions.push(
      commands.registerTextEditorCommand('typescriptHero.imports.organize', () => this.organizeImports()),
    );
    this.context.subscriptions.push(
      commands.registerTextEditorCommand('typescriptHero.index.addImport', () => this.addImport()),
    );
    this.context.subscriptions.push(
      workspace.onWillSaveTextDocument((event) => {
        if (!this.config.imports.organizeOnSave(event.document.uri)) {
          this.logger.debug(
            'OrganizeOnSave is deactivated through config',
          );
          return;
        }
        if (this.config.parseableLanguages().indexOf(event.document.languageId) < 0) {
          this.logger.debug(
            'OrganizeOnSave not possible for given language',
            { language: event.document.languageId },
          );
          return;
        }

        this.logger.info(
          'OrganizeOnSave for file',
          { file: event.document.fileName },
        );
        event.waitUntil(
          this.importManagerProvider(event.document).then(manager => manager.organizeImports().calculateTextEdits()),
        );
      }),
    );
  }

  public start(): void {
    this.logger.info('Starting up ImportOrganizer.');
  }

  public stop(): void {
    this.logger.info('Stopping ImportOrganizer.');
  }

  public dispose(): void {
    this.logger.debug('Disposing ImportOrganizer.');
  }

  /**
   * Organizes the imports of the actual document. Sorts and formats them correctly.
   *
   * @private
   * @returns {Promise<boolean>}
   *
   * @memberof ImportResolveExtension
   */
  private async organizeImports(): Promise<void> {
    if (!window.activeTextEditor) {
      return;
    }
    try {
      this.logger.debug(
        'Organize the imports in the document',
        { file: window.activeTextEditor.document.fileName },
      );
      const ctrl = await this.importManagerProvider(window.activeTextEditor.document);
      await ctrl.organizeImports().commit();
    } catch (e) {
      this.logger.error(
        'Imports could not be organized, error: %s',
        e,
        { file: window.activeTextEditor.document.fileName },
      );
    }
  }

  /**
   * Add an import from the whole list. Calls the vscode gui, where the user can
   * select a symbol to import.
   *
   * @private
   * @returns {Promise<void>}
   *
   * @memberof ResolveExtension
   */
  private async addImport(): Promise<void> {
    if (!window.activeTextEditor) {
      return;
    }
    const index = this.declarationManager.getIndexForFile(window.activeTextEditor.document.uri);
    if (!index || !index.indexReady) {
      this.showCacheWarning();
      return;
    }
    try {
      const selectedItem = await window.showQuickPick(
        index.declarationInfos.map(o => new ImportQuickPickItem(o)),
        { placeHolder: 'Add import to document:' },
      );
      if (selectedItem) {
        this.logger.info(
          'Add import to document',
          { specifier: selectedItem.declarationInfo.declaration.name, library: selectedItem.declarationInfo.from },
        );
        this.addImportToDocument(selectedItem.declarationInfo);
      }
    } catch (e) {
      this.logger.error(
        'Import could not be added to document',
        { file: window.activeTextEditor.document.fileName, error: e.toString() },
      );
      window.showErrorMessage('The import cannot be completed, there was an error during the process.');
    }
  }

  /**
   * Effectifely adds an import quick pick item to a document
   *
   * @private
   * @param {DeclarationInfo} declaration
   * @returns {Promise<boolean>}
   *
   * @memberof ImportResolveExtension
   */
  private async addImportToDocument(declaration: DeclarationInfo): Promise<boolean> {
    if (!window.activeTextEditor) {
      return false;
    }
    const ctrl = await this.importManagerProvider(window.activeTextEditor.document);
    return ctrl.addDeclarationImport(declaration).commit();
  }

  /**
   * Shows a user warning if the resolve index is not ready yet.
   *
   * @private
   *
   * @memberof ImportResolveExtension
   */
  private showCacheWarning(): void {
    this.logger.warn(
      'index was not ready or not index for this file found',
    );
    window.showWarningMessage('Please wait a few seconds longer until the symbol cache has been build.');
  }
}
