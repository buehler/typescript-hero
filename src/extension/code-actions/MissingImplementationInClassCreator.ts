import { getAbsolutLibraryName } from '../../common/helpers';
import { TypescriptParser } from '../../common/ts-parsing';
import { ClassLikeDeclaration, GenericDeclaration } from '../../common/ts-parsing/declarations/Declaration';
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

        let specifier = match[2];
        let types: string[] | undefined;
        let typeParams: { [type: string]: string } | undefined;
        const genericMatch = /^(.*)[<](.*)[>]$/.exec(specifier);

        if (genericMatch) {
            specifier = genericMatch[1];
            types = genericMatch[2].split(',').map(t => t.trim());
        }

        const parsedDocument = await this.parser.parseSource(document.getText());
        const alreadyImported = parsedDocument.imports.find(
            o => o instanceof NamedImport && o.specifiers.some(s => s.specifier === specifier),
        );
        const declaration = (parsedDocument.declarations.find(o => o.name === specifier) ||
            (this.index.declarationInfos.find(
                o => o.declaration.name === specifier &&
                    o.from === getAbsolutLibraryName(alreadyImported!.libraryName, document.fileName, workspace.rootPath),
            ) || { declaration: undefined }).declaration) as (ClassLikeDeclaration & GenericDeclaration) | undefined;

        if (commands.some((o: Command) => o.title.indexOf(specifier) >= 0)) {
            // Do leave the method when a command with the found class is already added.
            return commands;
        }

        if (!declaration) {
            commands.push(this.createCommand(
                `Cannot find "${specifier}" in the index or the actual file.`,
                new NoopCodeAction(),
            ));
            return commands;
        }

        if (genericMatch && declaration.typeParameters && types) {
            typeParams = {};
            for (const typeParam of declaration.typeParameters) {
                typeParams[typeParam] = types[declaration.typeParameters.indexOf(typeParam)];
            }
        }

        commands.push(this.createCommand(
            `Implement missing elements from "${genericMatch && types ? `${specifier}<${types.join(', ')}>` : specifier}".`,
            new ImplementPolymorphElements(document, match[1], declaration, typeParams),
        ));

        return commands;
    }
}
