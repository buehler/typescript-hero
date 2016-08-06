import {BaseExtension} from './extensions/BaseExtension';
import {GuiProvider} from './provider/GuiProvider';
import {Logger} from './utilities/Logger';
import {inject, injectable, multiInject} from 'inversify';
import {Disposable} from 'vscode';

@injectable()
export class TypeScriptHero implements Disposable {
    private logger: Logger;

    constructor( @inject('LoggerFactory') loggerFactory: (prefix?: string) => Logger, private guiProvider: GuiProvider, @multiInject('Extension') private extensions: BaseExtension[]) {
        this.logger = loggerFactory('TypescriptHero');
        //this.logger.error('Activation event called. TypeScriptHero instantiated.');
        this.logger.error('err', {foo: 'bar', baz: 15});
        this.logger.warning('warn', {foo: 'bar', baz: 15});
        this.logger.info('info', {foo: 'bar', baz: 15});
    }

    public dispose(): void {
        this.logger.info('Deactivation event called. Disposing TypeScriptHero.');
        for (let ext of this.extensions) {
            ext.dispose();
        }
    }
}
