import { inject, injectable, multiInject } from 'inversify';
import { GENERATORS, TypescriptCodeGenerator } from 'typescript-parser';

import Activatable from './activatable';
import { KeywordImportGroup, RegexImportGroup, RemainImportGroup } from './import-organizer/import-grouping';
import iocSymbols from './ioc-symbols';
import { Logger } from './utilities/Logger';

@injectable()
export default class TypescriptHero implements Activatable {
  constructor(
    @inject(iocSymbols.logger) private logger: Logger,
    @inject(iocSymbols.generatorFactory) private generator: TypescriptCodeGenerator,
    @multiInject(iocSymbols.activatables) private activatables: Activatable[],
  ) { }

  public setup(): void {
    this.logger.debug('Setting up extension and activatables.');
    this.extendCodeGenerator();
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
    const gen = this.generator;
    function simpleGenerator(generatable: any): string {
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
