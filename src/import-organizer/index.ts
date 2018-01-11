import { inject, injectable } from 'inversify';
import { TypescriptParser } from 'typescript-parser';
import { commands, ExtensionContext } from 'vscode';

import Activatable from '../activatable';
import Configuration from '../configuration';
import iocSymbols from '../ioc-symbols';
import { Logger } from '../utilities/Logger';

@injectable()
export default class ImportOrganizer implements Activatable {
  constructor(
    @inject(iocSymbols.extensionContext) private context: ExtensionContext,
    @inject(iocSymbols.logger) private logger: Logger,
    @inject(iocSymbols.configuration) private config: Configuration,
    @inject(iocSymbols.parser) private parser: TypescriptParser,
  ) { }

  public setup(): void {
    this.logger.debug('Setting up ImportOrganizer.');
    this.context.subscriptions.push(
      commands.registerTextEditorCommand('typescriptHero.importOrganizer.organize', () => this.organizeImports()),
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
}
