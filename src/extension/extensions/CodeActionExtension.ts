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

import { CodeAction } from '../code-actions/CodeAction';
import { CodeActionCreator } from '../code-actions/CodeActionCreator';
import { iocSymbols } from '../IoCSymbols';
import { DeclarationIndexMapper } from '../utilities/DeclarationIndexMapper';
import { Logger } from '../utilities/winstonLogger';
import { BaseExtension } from './BaseExtension';

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
    constructor(
        @inject(iocSymbols.extensionContext) context: ExtensionContext,
        @inject(iocSymbols.logger) private logger: Logger,
        @multiInject(iocSymbols.codeActionCreators) private actionCreators: CodeActionCreator[],
        @inject(iocSymbols.declarationIndexMapper) private indices: DeclarationIndexMapper,
    ) {
        super(context);
    }

    /**
     * Initialized the extension. Registers the commands and other disposables to the context.
     *
     * @memberof ImportResolveExtension
     */
    public initialize(): void {
        this.context.subscriptions.push(commands.registerCommand(
            'typescriptHero.codeFix.executeCodeAction',
            (codeAction: CodeAction | undefined) => this.executeCodeAction(codeAction),
        ));
        this.context.subscriptions.push(languages.registerCodeActionsProvider('typescript', this));
        this.context.subscriptions.push(languages.registerCodeActionsProvider('typescriptreact', this));

        this.logger.info('[%s] initialized', CodeActionCreator.name);
    }

    /**
     * Disposes the extension.
     *
     * @memberof ImportResolveExtension
     */
    public dispose(): void {
        this.logger.info('[%s] disposed', CodeActionCreator.name);
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
        const index = this.indices.getIndexForFile(document.uri);
        if (!index || !index.indexReady) {
            return [];
        }

        this.logger.debug(
            '[%s] provide code actions for file',
            CodeActionCreator.name,
            { file: document.fileName },
        );
        const profiler = this.logger.startTimer();

        let commands: Command[] = [];
        for (const diagnostic of context.diagnostics) {
            for (const creator of this.actionCreators) {
                if (creator.canHandleDiagnostic(diagnostic)) {
                    commands = await creator.handleDiagnostic(document, commands, diagnostic);
                }
            }
        }

        profiler.done({ message: `[${CodeActionCreator.name}] calculated diagnostics` });

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
    private async executeCodeAction(codeAction: CodeAction | undefined): Promise<void> {
        if (!codeAction) {
            this.logger.warn('[%s] executeCodeAction used without param', CodeActionCreator.name);
            window.showWarningMessage('This command is for internal use only. It cannot be used from Cmd+P');
            return;
        }
        if (!await codeAction.execute()) {
            this.logger.warn('[%s] code action could not complete', CodeActionCreator.name, { codeAction });
            window.showWarningMessage('The provided code action could not complete. Please see the logs.');
        }
    }
}
