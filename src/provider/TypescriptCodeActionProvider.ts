import { AddImportCodeAction, AddMissingImportsCodeAction, CodeAction } from '../models/CodeAction';
import { ResolveIndex } from '../caches/ResolveIndex';
import { Logger, LoggerFactory } from '../utilities/Logger';
import { inject, injectable } from 'inversify';
import {
    CancellationToken,
    CodeActionContext,
    CodeActionProvider,
    Command,
    Diagnostic,
    Range,
    TextDocument
} from 'vscode';

/**
 * Provider instance that is responsible for the "light bulb" feature.
 * It provides actions to take when errors occur in the current document (such as missing imports or 
 * non implemented interfaces.).
 * 
 * @export
 * @class TypescriptCodeActionProvider
 * @implements {CodeActionProvider}
 */
@injectable()
export class TypescriptCodeActionProvider implements CodeActionProvider {
    private logger: Logger;

    constructor(
        @inject('LoggerFactory') loggerFactory: LoggerFactory,
        private resolveIndex: ResolveIndex
    ) {
        this.logger = loggerFactory('TypescriptCodeActionProvider');
    }

    /**
     * Provides the commands to execute for a given problem.
     * 
     * @param {TextDocument} document
     * @param {Range} range
     * @param {CodeActionContext} context
     * @param {CancellationToken} token
     * @returns {(Command[] | Thenable<Command[]>)}
     * 
     * @memberOf TypescriptCodeActionProvider
     */
    public provideCodeActions(
        document: TextDocument,
        range: Range,
        context: CodeActionContext,
        token: CancellationToken
    ): Command[] {
        let commands = [],
            match: RegExpExecArray,
            addAllMissingImportsAdded = false;

        for (let diagnostic of context.diagnostics) {
            switch (true) {
                // When the problem is a missing import, add the import to the document.
                case !!(match = isMissingImport(diagnostic)):
                    let info = this.resolveIndex.declarationInfos.find(o => o.declaration.name === match[1]);
                    if (info) {
                        commands.push(this.createCommand(
                            `Import ${info.declaration.name} to the document.`,
                            new AddImportCodeAction(document, info)
                        ));
                        if (!addAllMissingImportsAdded) {
                            commands.push(this.createCommand(
                                'Add all missing imports if possible.',
                                new AddMissingImportsCodeAction(document, this.resolveIndex)
                            ));
                        }
                    }
                    break;
                default:
                    break;
            }
        }

        return commands;
    }

    /**
     * Creates a customized command for the lightbulb with the correct strings.
     * 
     * @private
     * @param {string} title
     * @param {CodeAction} codeAction
     * @returns {Command}
     * 
     * @memberOf TypescriptCodeActionProvider
     */
    private createCommand(title: string, codeAction: CodeAction): Command {
        return {
            arguments: [codeAction],
            command: 'typescriptHero.codeFix.executeCodeAction',
            title
        };
    }
}

/**
 * Determines if the problem is a missing import.
 * 
 * @param {Diagnostic} diagnostic
 * @returns {RegExpExecArray}
 */
function isMissingImport(diagnostic: Diagnostic): RegExpExecArray {
    return /cannot find name ['"](.*)['"]/ig.exec(diagnostic.message);
}
