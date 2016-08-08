import {BaseExtension} from './extensions/BaseExtension';
import {GuiProvider} from './provider/GuiProvider';
import {Logger, LoggerFactory} from './utilities/Logger';
import {inject, injectable, multiInject} from 'inversify';
import {Disposable} from 'vscode';

@injectable()
export class TypeScriptHero implements Disposable {
    private logger: Logger;

    constructor( @inject('LoggerFactory') loggerFactory: LoggerFactory, private guiProvider: GuiProvider, @multiInject('Extension') private extensions: BaseExtension[]) {
        this.logger = loggerFactory('TypescriptHero');
        this.logger.info('Activation event called. TypeScriptHero instantiated.');
    }

    public dispose(): void {
        this.logger.info('Deactivation event called. Disposing TypeScriptHero.');
        for (let ext of this.extensions) {
            ext.dispose();
        }
    }
}
