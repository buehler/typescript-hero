import { inject, injectable } from 'inversify';
import { commands, ExtensionContext, window, workspace } from 'vscode';

import Activatable from '../activatable';
import Configuration from '../configuration';
import iocSymbols, { ImportManagerProvider } from '../ioc-symbols';
import { Logger } from '../utilities/logger';

@injectable()
export class ImportOrganizer implements Activatable {
  constructor(
    @inject(iocSymbols.extensionContext) private context: ExtensionContext,
    @inject(iocSymbols.logger) private logger: Logger,
    @inject(iocSymbols.configuration) private config: Configuration,
    @inject(iocSymbols.importManager) private importManagerProvider: ImportManagerProvider,
  ) { }

  public setup(): void {
    this.logger.debug('[ImportOrganizer] Setting up ImportOrganizer.');
    this.context.subscriptions.push(
      commands.registerTextEditorCommand('typescriptHero.imports.organize', () => this.organizeImports()),
    );
    this.context.subscriptions.push(
      workspace.onWillSaveTextDocument((event) => {
        if (!this.config.imports.organizeOnSave(event.document.uri)) {
          this.logger.debug(
            '[ImportOrganizer] OrganizeOnSave is deactivated through config',
          );
          return;
        }
        if (this.config.parseableLanguages().indexOf(event.document.languageId) < 0) {
          this.logger.debug(
            '[ImportOrganizer] OrganizeOnSave not possible for given language',
            { language: event.document.languageId },
          );
          return;
        }

        this.logger.info(
          '[ImportOrganizer] OrganizeOnSave for file',
          { file: event.document.fileName },
        );
        event.waitUntil(
          this.importManagerProvider(event.document).then(manager => manager.organizeImports().calculateTextEdits()),
        );
      }),
    );
  }

  public start(): void {
    this.logger.info('[ImportOrganizer] Starting up ImportOrganizer.');
  }

  public stop(): void {
    this.logger.info('[ImportOrganizer] Stopping ImportOrganizer.');
  }

  public dispose(): void {
    this.logger.debug('[ImportOrganizer] Disposing ImportOrganizer.');
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
        '[ImportOrganizer] Organize the imports in the document',
        { file: window.activeTextEditor.document.fileName },
      );
      const ctrl = await this.importManagerProvider(window.activeTextEditor.document);
      await ctrl.organizeImports().commit();
    } catch (e) {
      this.logger.error(
        '[ImportOrganizer] Imports could not be organized, error: %s',
        e,
        { file: window.activeTextEditor.document.fileName },
      );
    }
  }
}
