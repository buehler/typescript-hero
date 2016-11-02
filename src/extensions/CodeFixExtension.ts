import { TypescriptCodeActionProvider } from '../provider/TypescriptCodeActionProvider';
import { CommandQuickPickItem } from '../models/QuickPickItems';
import { Logger, LoggerFactory } from '../utilities/Logger';
import { BaseExtension } from './BaseExtension';
import { inject, injectable } from 'inversify';
import { commands, ExtensionContext, languages } from 'vscode';

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
        context.subscriptions.push(commands.registerCommand('typescriptHero.codeFix.executeCodeAction',
            (codeAction: any) => this.executeCodeAction(codeAction)));
        context.subscriptions.push(languages.registerCodeActionsProvider('typescript', this.codeActionProvider));
        this.logger.info('Initialized.');
    }

    public dispose(): void {
        this.logger.info('Dispose called.');
    }

    private executeCodeAction(codeAction: any): void {
        console.log(codeAction);
    }

}
