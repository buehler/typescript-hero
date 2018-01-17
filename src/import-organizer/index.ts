import { inject, injectable } from 'inversify';
import { commands, ExtensionContext, window } from 'vscode';

import Activatable from '../activatable';
import iocSymbols, { ImportManagerProvider } from '../ioc-symbols';
import { Logger } from '../utilities/Logger';

@injectable()
export default class ImportOrganizer implements Activatable {
  constructor(
    @inject(iocSymbols.extensionContext) private context: ExtensionContext,
    @inject(iocSymbols.logger) private logger: Logger,
    // @inject(iocSymbols.configuration) private config: Configuration,
    // @inject(iocSymbols.parser) private parser: TypescriptParser,
    @inject(iocSymbols.importManager) private importManagerProvider: ImportManagerProvider,
  ) { }

  public setup(): void {
    this.logger.debug('Setting up ImportOrganizer.');
    this.context.subscriptions.push(
      commands.registerTextEditorCommand('typescriptHero.imports.organize', () => this.organizeImports()),
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

  private async organizeImports(): Promise<void> {
    if (!window.activeTextEditor) {
      return;
    }
    try {
      this.logger.debug(
        '[ImportOrganizer] organize the imports in the document',
        { file: window.activeTextEditor.document.fileName },
      );
      const ctrl = await this.importManagerProvider(window.activeTextEditor.document);
      await ctrl.organizeImports().commit();
    } catch (e) {
      this.logger.error(
        '[ImportOrganizer] imports could not be organized, error: %s',
        e,
        { file: window.activeTextEditor.document.fileName },
      );
    }
  }
}
