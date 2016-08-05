import {BaseExtension} from '../extensions/BaseExtension';
import {CommandQuickPickItem} from '../models/CommandQuickPickItem';
import {inject, injectable, multiInject} from 'inversify';
import {commands, ExtensionContext} from 'vscode';

@injectable()
export class GuiProvider {
    constructor( @inject('context') context: ExtensionContext, @multiInject('Extension') private extensions: BaseExtension[]) {
        console.log('GuiProvider instantiated');

        context.subscriptions.push(commands.registerCommand('typescriptHero.showCmdGui', () => this.showGui()));
    }

    private showGui(): void {
        console.log('yay');
    }

    private executeCommand(cmd: CommandQuickPickItem): void {
        
    }
}
