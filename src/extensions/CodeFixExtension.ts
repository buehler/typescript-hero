// import { CodeAction } from '../models/CodeAction';
// import { CommandQuickPickItem } from '../models/QuickPickItems';
// import { TypescriptCodeActionProvider } from '../provider/TypescriptCodeActionProvider';
// import { Logger, LoggerFactory } from '../utilities/Logger';
// import { BaseExtension } from './BaseExtension';
// import { inject, injectable } from 'inversify';
// import { ExtensionContext, languages, commands } from 'vscode';

// @injectable()
// export class CodeFixExtension extends BaseExtension {
//     private logger: Logger;

//     constructor( @inject('LoggerFactory') loggerFactory: LoggerFactory,
//         private codeActionProvider: TypescriptCodeActionProvider) {
//         super();

//         this.logger = loggerFactory('CodeFixExtension');
//         this.logger.info('Extension instantiated.');
//     }

//     public getGuiCommands(): CommandQuickPickItem[] {
//         return [];
//     }

//     public initialize(context: ExtensionContext): void {
//         context.subscriptions.push(commands.registerCommand('typescriptHero.codeFix.executeCodeAction', (codeAction: CodeAction) => this.executeCodeAction(codeAction)));
//         context.subscriptions.push(languages.registerCodeActionsProvider('typescript', this.codeActionProvider));
//         this.logger.info('Initialized.');
//     }

//     public dispose(): void {
//         this.logger.info('Dispose called.');
//     }

//     private executeCodeAction(codeAction: CodeAction): void {
//         console.log(codeAction);
//     }

// }
