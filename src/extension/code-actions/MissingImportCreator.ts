import { inject, injectable } from 'inversify';
import { Command, Diagnostic, TextDocument } from 'vscode';

import { iocSymbols } from '../IoCSymbols';
import { DeclarationIndexMapper } from '../utilities/DeclarationIndexMapper';
import { AddImportCodeAction, AddMissingImportsCodeAction, NoopCodeAction } from './CodeAction';
import { CodeActionCreator } from './CodeActionCreator';

/**
 * Action creator that handles missing imports in files.
 *
 * @export
 * @class MissingImportCreator
 * @extends {CodeActionCreator}
 */
@injectable()
export class MissingImportCreator extends CodeActionCreator {
    constructor(
        @inject(iocSymbols.declarationIndexMapper) private indices: DeclarationIndexMapper,
    ) {
        super();
    }

    /**
     * Determines if the given diagnostic can be handled by this creator.
     *
     * @param {Diagnostic} diagnostic
     * @returns {boolean}
     *
     * @memberof MissingImportCreator
     */
    public canHandleDiagnostic(diagnostic: Diagnostic): boolean {
        return /cannot find name ['"](.*)['"]/ig.test(diagnostic.message);
    }

    /**
     * Handles the given diagnostic. Must return an array of commands that are given to the light bulb.
     *
     * @param {TextDocument} document The commands that are created until now
     * @param {Command[]} commands The commands that are created until now
     * @param {Diagnostic} diagnostic The diagnostic to handle
     * @returns {Promise<Command[]>}
     *
     * @memberof MissingImportCreator
     */
    public async handleDiagnostic(document: TextDocument, commands: Command[], diagnostic: Diagnostic): Promise<Command[]> {
        const match = /cannot find name ['"](.*)['"]/ig.exec(diagnostic.message);
        const index = this.indices.getIndexForFile(document.uri);

        if (!match || !index) {
            return commands;
        }

        const infos = index.declarationInfos.filter(o => o.declaration.name === match[1]);
        if (infos.length > 0) {
            for (const info of infos) {
                commands.push(this.createCommand(
                    `Import "${info.declaration.name}" from "${info.from}".`,
                    new AddImportCodeAction(document, info),
                ));
            }
            if (
                !commands.some(o =>
                    o.arguments !== undefined &&
                    o.arguments.some(a => a instanceof AddMissingImportsCodeAction),
                )
            ) {
                commands.push(this.createCommand(
                    'Add all missing imports if possible.',
                    new AddMissingImportsCodeAction(document, index),
                ));
            }
        } else {
            commands.push(this.createCommand(
                `Cannot find "${match[1]}" in the index.`,
                new NoopCodeAction(),
            ));
        }

        return commands;
    }
}
