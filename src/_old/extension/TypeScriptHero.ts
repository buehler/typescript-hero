import { inject, injectable, multiInject } from 'inversify';
import { Disposable } from 'vscode';

import { BaseExtension } from './extensions/BaseExtension';
import { iocSymbols } from './IoCSymbols';
import { Logger } from './utilities/winstonLogger';

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
    constructor(
        @inject(iocSymbols.logger) private logger: Logger,
        @multiInject(iocSymbols.extensions) private extensions: BaseExtension[],
    ) {
        this.logger.debug('[%s] activation event, initializing', TypeScriptHero.name);
        this.extensions.forEach(o => o.initialize());
        this.logger.info('[%s] initialized', TypeScriptHero.name);
    }

    /**
     * Disposes TypeScript Hero.
     *
     * @memberof TypeScriptHero
     */
    public dispose(): void {
        this.logger.debug('[%s] deactivation event, disposing', TypeScriptHero.name);
        for (const ext of this.extensions) {
            ext.dispose();
        }
        this.logger.info('[%s] disposed', TypeScriptHero.name);
    }
}
