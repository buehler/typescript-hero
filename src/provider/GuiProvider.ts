import { BaseExtension } from '../extensions/BaseExtension';
import { CommandQuickPickItem } from '../models/QuickPickItems';
import { inject, injectable, multiInject } from 'inversify';
import { commands, ExtensionContext, window } from 'vscode';

@injectable()
export class GuiProvider {
    constructor( @inject('context') context: ExtensionContext, @multiInject('Extension') private extensions: BaseExtension[]) {
        context.subscriptions.push(commands.registerCommand('typescriptHero.showCmdGui', () => this.showGui()));
    }

    private async showGui(): Promise<void> {
        let cmd = await window.showQuickPick<CommandQuickPickItem>(this.extensions.reduce((all, cur) => all.concat(cur.getGuiCommands()), []));
        if (!cmd) {
            return;
        }
        this.executeCommand(cmd);
    }

    private executeCommand(cmd: CommandQuickPickItem): void {
        cmd.command.action();
    }
}
