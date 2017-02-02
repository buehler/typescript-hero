import { Logger, LoggerFactory } from '../common/utilities';
import { BaseExtension } from './extensions/BaseExtension';
import { Symbols } from './IoC';
import { inject, injectable, multiInject } from 'inversify';
import { Disposable } from 'vscode';

/**
 * TypeScript Hero vscode extension.
 * Central entrypoint.
 * 
 * @export
 * @class TypeScriptHero
 * @implements {Disposable}
 */
@injectable()
export class TypeScriptHero implements Disposable {
    private logger: Logger;

    constructor(
        @inject(Symbols.loggerFactory) loggerFactory: LoggerFactory,
        @multiInject(Symbols.extensions) private extensions: BaseExtension[]
    ) {
        this.logger = loggerFactory('TypescriptHero');
        this.logger.info('Activation event called. TypeScriptHero instantiated.');

        this.extensions.forEach(o => o.initialize());
    }

    /**
     * Disposes TypeScript Hero.
     * 
     * @memberOf TypeScriptHero
     */
    public dispose(): void {
        this.logger.info('Deactivation event called. Disposing TypeScriptHero.');
        for (let ext of this.extensions) {
            ext.dispose();
        }
    }
}
