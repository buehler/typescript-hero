import { CodeAction } from '../models/CodeAction';
import { TypescriptCodeActionProvider } from '../provider/TypescriptCodeActionProvider';
import { CommandQuickPickItem } from '../models/QuickPickItems';
import { Logger, LoggerFactory } from '../utilities/Logger';
import { BaseExtension } from './BaseExtension';
import { inject, injectable } from 'inversify';
import { commands, ExtensionContext, languages, window } from 'vscode';

/**
 * Extension that helps the user fix problems in the code.
 * As an example, if the user copy pastes code and does not have the imports, this part should help with that.
 * 
 * @export
 * @class CodeFixExtension
 * @extends {BaseExtension}
 */
@injectable()
export class CodeFixExtension extends BaseExtension {
    private logger: Logger;

    constructor(
        @inject('LoggerFactory') loggerFactory: LoggerFactory,
        private codeActionProvider: TypescriptCodeActionProvider
    ) {
        super();

        this.logger = loggerFactory('CodeFixExtension');
        this.logger.info('Extension instantiated.');
    }

    public getGuiCommands(): CommandQuickPickItem[] {
        return [];
    }

    public initialize(context: ExtensionContext): void {
        context.subscriptions.push(commands.registerCommand(
            'typescriptHero.codeFix.executeCodeAction',
            (codeAction: CodeAction) => this.executeCodeAction(codeAction)
        ));
        context.subscriptions.push(languages.registerCodeActionsProvider('typescript', this.codeActionProvider));
        this.logger.info('Initialized.');
    }

    public dispose(): void {
        this.logger.info('Dispose called.');
    }

    /**
     * Executes a code action. If the result is false, a warning is shown.
     * 
     * @private
     * @param {CodeAction} codeAction
     * @returns {Promise<void>}
     * 
     * @memberOf CodeFixExtension
     */
    private async executeCodeAction(codeAction: CodeAction): Promise<void> {
        if (!await codeAction.execute()) {
            window.showWarningMessage('The provided code action could not complete. Please see the logs.');
        }
    }
}
