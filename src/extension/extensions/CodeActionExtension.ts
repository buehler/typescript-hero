import { Logger, LoggerFactory } from '../../common/utilities';
import { CodeAction } from '../code-actions/CodeAction';
import { CodeActionCreator } from '../code-actions/CodeActionCreator';
import { iocSymbols } from '../IoCSymbols';
import { BaseExtension } from './BaseExtension';
import { inject, injectable, multiInject } from 'inversify';
import {
    CancellationToken,
    CodeActionContext,
    CodeActionProvider,
    Command,
    commands,
    ExtensionContext,
    languages,
    Range,
    TextDocument,
    window,
} from 'vscode';

/**
 * Provider instance that is responsible for the "light bulb" feature.
 * It provides actions to take when errors occur in the current document (such as missing imports or 
 * non implemented interfaces.).
 * 
 * @export
 * @class CodeActionExtension
 * @implements {CodeActionProvider}
 */
@injectable()
export class CodeActionExtension extends BaseExtension implements CodeActionProvider {
    private logger: Logger;

    constructor(
        @inject(iocSymbols.extensionContext) context: ExtensionContext,
        @inject(iocSymbols.loggerFactory) loggerFactory: LoggerFactory,
        @multiInject(iocSymbols.codeActionCreators) private actionCreators: CodeActionCreator[],
    ) {
        super(context);
        this.logger = loggerFactory('CodeActionExtension');
    }

    /**
     * Initialized the extension. Registers the commands and other disposables to the context.
     * 
     * @memberof ImportResolveExtension
     */
    public initialize(): void {
        this.context.subscriptions.push(commands.registerCommand(
            'typescriptHero.codeFix.executeCodeAction',
            (codeAction: CodeAction) => this.executeCodeAction(codeAction),
        ));
        this.context.subscriptions.push(languages.registerCodeActionsProvider('typescript', this));
        this.context.subscriptions.push(languages.registerCodeActionsProvider('typescriptreact', this));

        this.logger.info('Initialized');
    }

    /**
     * Disposes the extension.
     * 
     * @memberof ImportResolveExtension
     */
    public dispose(): void {
        this.logger.info('Disposed');
    }

    /**
     * Provides the commands to execute for a given problem.
     * 
     * @param {TextDocument} document
     * @param {Range} range
     * @param {CodeActionContext} context
     * @param {CancellationToken} token
     * @returns {Promise<Command[]>}
     * 
     * @memberof CodeActionExtension
     */
    public async provideCodeActions(
        document: TextDocument,
        _range: Range,
        context: CodeActionContext,
        _token: CancellationToken,
    ): Promise<Command[]> {
        let commands: Command[] = [];
        for (const diagnostic of context.diagnostics) {
            for (const creator of this.actionCreators) {
                if (creator.canHandleDiagnostic(diagnostic)) {
                    commands = await creator.handleDiagnostic(document, commands, diagnostic);
                }
            }
        }

        return commands;
    }

    /**
     * Executes a code action. If the result is false, a warning is shown.
     * 
     * @private
     * @param {CodeAction} codeAction
     * @returns {Promise<void>}
     * 
     * @memberof CodeFixExtension
     */
    private async executeCodeAction(codeAction: CodeAction): Promise<void> {
        if (!await codeAction.execute()) {
            window.showWarningMessage('The provided code action could not complete. Please see the logs.');
        }
    }
}
