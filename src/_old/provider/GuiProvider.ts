import { BaseExtension } from '../extensions/BaseExtension';
import { CommandQuickPickItem } from '../models/QuickPickItems';
import { inject, injectable, multiInject } from 'inversify';
import { commands, ExtensionContext, window } from 'vscode';

/**
 * Provider instance that provides the typescript hero "gui" to the user.
 * Is responsible of collecting gui command from all possible extension parts and executing the given commands.
 * 
 * @export
 * @class GuiProvider
 */
@injectable()
export class GuiProvider {
    constructor(
        @inject('context') context: ExtensionContext,
        @multiInject('Extension') private extensions: BaseExtension[]
    ) {
        context.subscriptions.push(commands.registerCommand('typescriptHero.showCmdGui', () => this.showGui()));
    }

    /**
     * Shows the "gui" (which is literally a quickpick of vscode) to the user with all found commands.
     * Upon selection, the command is executed.
     * 
     * @private
     * @returns {Promise<void>}
     * 
     * @memberOf GuiProvider
     */
    private async showGui(): Promise<void> {
        let cmd = await window.showQuickPick<CommandQuickPickItem>(
            this.extensions.reduce((all, cur) => all.concat(cur.getGuiCommands()), [])
        );
        if (!cmd) {
            return;
        }
        this.executeCommand(cmd);
    }

    /**
     * Executes a given TshCommand.
     * 
     * @private
     * @param {CommandQuickPickItem} cmd
     * 
     * @memberOf GuiProvider
     */
    private executeCommand(cmd: CommandQuickPickItem): void {
        cmd.command.action();
    }
}
