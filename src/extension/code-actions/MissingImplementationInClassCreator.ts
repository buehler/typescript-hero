import { getAbsolutLibraryName } from '../../common/helpers';
import { TypescriptParser } from '../../common/ts-parsing';
import { InterfaceDeclaration } from '../../common/ts-parsing/declarations';
import { NamedImport } from '../../common/ts-parsing/imports';
import { CalculatedDeclarationIndex } from '../declarations/CalculatedDeclarationIndex';
import { ImplementPolymorphElements, NoopCodeAction } from './CodeAction';
import { CodeActionCreator } from './CodeActionCreator';
import { injectable } from 'inversify';
import { Command, Diagnostic, TextDocument, workspace } from 'vscode';

/**
 * Action creator that handles missing implementations in a class.
 * 
 * @export
 * @class MissingImplementationInClassCreator
 * @extends {CodeActionCreator}
 */
@injectable()
export class MissingImplementationInClassCreator extends CodeActionCreator {
    constructor(private parser: TypescriptParser, private index: CalculatedDeclarationIndex) {
        super();
    }

    /**
     * Determines if the given diagnostic can be handled by this creator.
     * 
     * @param {Diagnostic} diagnostic 
     * @returns {boolean} 
     * 
     * @memberof MissingImplementationInClassCreator
     */
    public canHandleDiagnostic(diagnostic: Diagnostic): boolean {
        return /class ['"](.*)['"] incorrectly implements.*['"](.*)['"]\./ig.test(diagnostic.message) ||
            /non-abstract class ['"](.*)['"].*implement inherited.*from class ['"](.*)['"]\./ig.test(diagnostic.message);
    }

    /**
     * Handles the given diagnostic. Must return an array of commands that are given to the light bulb.
     * 
     * @param {TextDocument} document The commands that are created until now
     * @param {Command[]} commands The commands that are created until now
     * @param {Diagnostic} diagnostic The diagnostic to handle
     * @returns {Promise<Command[]>} 
     * 
     * @memberof MissingImplementationInClassCreator
     */
    public async handleDiagnostic(document: TextDocument, commands: Command[], diagnostic: Diagnostic): Promise<Command[]> {
        const match = /class ['"](.*)['"] incorrectly implements.*['"](.*)['"]\./ig.exec(diagnostic.message) ||
            /non-abstract class ['"](.*)['"].*implement inherited.*from class ['"](.*)['"]\./ig.exec(diagnostic.message);

        if (!match) {
            return commands;
        }

        const parsedDocument = await this.parser.parseSource(document.getText());
        const alreadyImported = parsedDocument.imports.find(
            o => o instanceof NamedImport && o.specifiers.some(s => s.specifier === match[2]),
        );
        const declaration = parsedDocument.declarations.find(o => o.name === match[2]) ||
            (this.index.declarationInfos.find(
                o => o.declaration.name === match[2] &&
                    o.from === getAbsolutLibraryName(alreadyImported!.libraryName, document.fileName, workspace.rootPath),
            ) || { declaration: undefined }).declaration;

        if (commands.some((o: Command) => o.title.indexOf(match[2]) >= 0)) {
            // Do leave the method when a command with the found class is already added.
            return commands;
        }

        if (!declaration) {
            commands.push(this.createCommand(
                `Cannot find "${match[2]}" in the index or the actual file.`,
                new NoopCodeAction(),
            ));
            return commands;
        }

        commands.push(this.createCommand(
            `Implement missing elements from "${match[2]}".`,
            new ImplementPolymorphElements(document, match[1], <InterfaceDeclaration>declaration),
        ));

        return commands;
    }
}
