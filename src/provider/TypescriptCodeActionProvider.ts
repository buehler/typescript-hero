import { injectable } from 'inversify';
import { CancellationToken, CodeActionContext, CodeActionProvider, Command, Range, TextDocument } from 'vscode';

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
    ): Command[] | Thenable<Command[]> {
        return null;
    }
}
