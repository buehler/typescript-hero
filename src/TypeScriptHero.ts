import {BaseExtension} from './extensions/BaseExtension';
import {GuiProvider} from './provider/GuiProvider';
import {injectable, multiInject} from 'inversify';
import {Disposable} from 'vscode';

@injectable()
export class TypeScriptHero implements Disposable {

    constructor(private guiProvider: GuiProvider, @multiInject('Extension') private extensions: BaseExtension[]) {
        console.log('Activation event called. TypeScriptHero instantiated.');
    }

    public dispose(): void {
        console.log('Deactivation event called. Disposing TypeScriptHero.');
        for (let ext of this.extensions) {
            ext.dispose();
        }
    }
}
