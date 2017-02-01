import { BaseExtension } from './extensions/BaseExtension';
import { GuiProvider } from './provider/GuiProvider';
import { Logger, LoggerFactory } from './utilities/Logger';
import { inject, injectable, multiInject } from 'inversify';
import { Disposable, ExtensionContext } from 'vscode';

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
        @inject('LoggerFactory') loggerFactory: LoggerFactory,
        private guiProvider: GuiProvider,
        @multiInject('Extension') private extensions: BaseExtension[],
        @inject('context') context: ExtensionContext
    ) {
        this.logger = loggerFactory('TypescriptHero');
        this.logger.info('Activation event called. TypeScriptHero instantiated.');

        this.extensions.forEach(o => o.initialize(context));
    }

    /**
     * Disposes TypeScript Hero.
     * 
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
