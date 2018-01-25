import { inject, injectable, multiInject } from 'inversify';
import { Generatable, GENERATORS, TypescriptCodeGenerator, TypescriptGenerationOptions } from 'typescript-parser';

import Activatable from './activatable';
import DeclarationManager from './declarations/declaration-manager';
import { KeywordImportGroup, RegexImportGroup, RemainImportGroup } from './import-organizer/import-grouping';
import iocSymbols from './ioc-symbols';
import { Logger } from './utilities/logger';

@injectable()
export default class TypescriptHero implements Activatable {
  constructor(
    @inject(iocSymbols.logger) private logger: Logger,
    @multiInject(iocSymbols.activatables) private activatables: Activatable[],
    @inject(iocSymbols.declarationManager) private mgmr: DeclarationManager,
  ) { }

  public setup(): void {
    this.logger.debug('Setting up extension and activatables.');
    this.extendCodeGenerator();
    console.log(this.mgmr);
    for (const activatable of this.activatables) {
      activatable.setup();
    }
  }

  public start(): void {
    this.logger.debug('Starting up extension and activatables.');
    for (const activatable of this.activatables) {
      activatable.start();
    }
  }

  public stop(): void {
    this.logger.debug('Stopping extension and activatables.');
    for (const activatable of this.activatables) {
      activatable.stop();
    }
  }

  public dispose(): void {
    this.logger.debug('Disposing extension and activatables.');
    for (const activatable of this.activatables) {
      activatable.dispose();
    }
  }

  private extendCodeGenerator(): void {
    function simpleGenerator(generatable: Generatable, options: TypescriptGenerationOptions): string {
      const gen = new TypescriptCodeGenerator(options);
      const group = generatable as KeywordImportGroup;
      if (!group.imports.length) {
        return '';
      }
      return group.sortedImports
        .map(imp => gen.generate(imp))
        .join('\n') + '\n';
    }

    GENERATORS[KeywordImportGroup.name] = simpleGenerator;
    GENERATORS[RegexImportGroup.name] = simpleGenerator;
    GENERATORS[RemainImportGroup.name] = simpleGenerator;
  }
}
