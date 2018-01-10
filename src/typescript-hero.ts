import { inject, injectable, multiInject } from 'inversify';

import Activatable from './activatable';
import iocSymbols from './ioc-symbols';
import { Logger } from './utilities/Logger';

@injectable()
export default class TypescriptHero implements Activatable {
  constructor(
    @inject(iocSymbols.logger) private logger: Logger,
    @multiInject(iocSymbols.activatables) private activatables: Activatable[],
  ) { }

  public setup(): void {
    this.logger.debug('Setting up extension and activatables.');
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
}
