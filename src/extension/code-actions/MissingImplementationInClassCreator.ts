import { inject, injectable } from 'inversify';
import { ClassLikeDeclaration, GenericDeclaration, NamedImport, TypescriptParser } from 'typescript-parser';
import { Command, Diagnostic, TextDocument, workspace } from 'vscode';

import { getAbsolutLibraryName } from '../../common/helpers';
import { iocSymbols } from '../IoCSymbols';
import { DeclarationIndexMapper } from '../utilities/DeclarationIndexMapper';
import { getScriptKind } from '../utilities/utilityFunctions';
import { Logger } from '../utilities/winstonLogger';
import { ImplementPolymorphElements, NoopCodeAction } from './CodeAction';
import { CodeActionCreator } from './CodeActionCreator';

const REGEX_GENERICS = /^(.*)<(.*)>$/;
const REGEX_INCORRECT_IMPL = /class (['"])(.*)\1 incorrectly implements.*(['"])(.*)\3\./i;
const REGEX_NON_ABSTRACT_IMPL = /non-abstract class (['"])(.*)\1.*implement inherited.*from class (['"])(.*)\3\./i;

/**
 * Action creator that handles missing implementations in a class.
 *
 * @export
 * @class MissingImplementationInClassCreator
 * @extends {CodeActionCreator}
 */
@injectable()
export class MissingImplementationInClassCreator extends CodeActionCreator {
    constructor(
        @inject(iocSymbols.typescriptParser) private parser: TypescriptParser,
        @inject(iocSymbols.declarationIndexMapper) private indices: DeclarationIndexMapper,
        @inject(iocSymbols.logger) private logger: Logger,
    ) {
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
        return REGEX_INCORRECT_IMPL.test(diagnostic.message) ||
            REGEX_NON_ABSTRACT_IMPL.test(diagnostic.message);
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
        const match = REGEX_INCORRECT_IMPL.exec(diagnostic.message) ||
            REGEX_NON_ABSTRACT_IMPL.exec(diagnostic.message);

        const index = this.indices.getIndexForFile(document.uri);
        const rootFolder = workspace.getWorkspaceFolder(document.uri);

        if (!match || !index || !rootFolder) {
            this.logger.debug(
                '[%s] cannot handle the diagnostic',
                MissingImplementationInClassCreator.name,
            );
            return commands;
        }

        let specifier = match[4];
        let types: string[] | undefined;
        let typeParams: { [type: string]: string } | undefined;
        const genericMatch = REGEX_GENERICS.exec(specifier);

        if (genericMatch) {
            specifier = genericMatch[1];
            types = genericMatch[2].split(',').map(t => t.trim());
        }

        const parsedDocument = await this.parser.parseSource(document.getText(), getScriptKind(document.fileName));
        const alreadyImported = parsedDocument.imports.find(
            o => o instanceof NamedImport && o.specifiers.some(s => s.specifier === specifier),
        );
        const declaration = (parsedDocument.declarations.find(o => o.name === specifier) ||
            (index.declarationInfos.find(
                o => o.declaration.name === specifier &&
                    o.from === getAbsolutLibraryName(alreadyImported!.libraryName, document.fileName, rootFolder.uri.fsPath),
            ) || { declaration: undefined }).declaration) as (ClassLikeDeclaration & GenericDeclaration) | undefined;

        if (commands.some((o: Command) => o.title.indexOf(specifier) >= 0)) {
            // Do leave the method when a command with the found class is already added.
            this.logger.debug(
                '[%s] command with the found class is already added',
                MissingImplementationInClassCreator.name,
            );
            return commands;
        }

        if (!declaration) {
            this.logger.debug(
                '[%s] class definition not found in the index',
                MissingImplementationInClassCreator.name,
                { specifier },
            );
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
            new ImplementPolymorphElements(document, match[2], declaration, typeParams),
        ));

        this.logger.debug(
            '[%s] adding commands to handle missing implementation',
            MissingImplementationInClassCreator.name,
            { specifier, types },
        );

        return commands;
    }
}
