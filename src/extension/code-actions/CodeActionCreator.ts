import { CodeAction } from './CodeAction';
import { injectable } from 'inversify';
import { Command, Diagnostic, TextDocument } from 'vscode';

/**
 * Interface for a action creator. A creator is registered in the code action extension and does create
 * commands out of a diagnostic.
 * 
 * @export
 * @abstract
 * @class CodeActionCreator
 */
@injectable()
export abstract class CodeActionCreator {
    /**
     * Determines if the given diagnostic can be handled by this creator.
     * 
     * @param {Diagnostic} diagnostic 
     * @returns {boolean} 
     * 
     * @memberof CodeActionCreator
     */
    public abstract canHandleDiagnostic(diagnostic: Diagnostic): boolean;

    /**
     * Handles the given diagnostic. Must return an array of commands that are given to the light bulb.
     * 
     * @param {TextDocument} document The commands that are created until now
     * @param {Command[]} commands The commands that are created until now
     * @param {Diagnostic} diagnostic The diagnostic to handle
     * @returns {Promise<Command[]>} 
     * 
     * @memberof CodeActionCreator
     */
    public abstract handleDiagnostic(
        document: TextDocument,
        commands: Command[],
        diagnostic: Diagnostic,
    ): Promise<Command[]>;

    /**
     * Creates a customized command for the lightbulb with the correct strings.
     * 
     * @private
     * @param {string} title
     * @param {CodeAction} codeAction
     * @returns {Command}
     * 
     * @memberof CodeActionCreator
     */
    protected createCommand(title: string, codeAction: CodeAction): Command {
        return {
            arguments: [codeAction],
            command: 'typescriptHero.codeFix.executeCodeAction',
            title,
        };
    }
}
