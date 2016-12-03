import { getAbsolutLibraryName } from '../utilities/ResolveIndexExtensions';
import { TsNamedImport } from '../models/TsImport';
import { TsResourceParser } from '../parser/TsResourceParser';
import {
    AddImportCodeAction,
    AddMissingImportsCodeAction,
    CodeAction,
    ImplementPolymorphElements,
    NoopCodeAction
} from '../models/CodeAction';
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
        private resolveIndex: ResolveIndex,
        private parser: TsResourceParser
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
     * @returns {Promise<Command[]>}
     * 
     * @memberOf TypescriptCodeActionProvider
     */
    public async provideCodeActions(
        document: TextDocument,
        range: Range,
        context: CodeActionContext,
        token: CancellationToken
    ): Promise<Command[]> {
        let commands = [],
            match: RegExpExecArray,
            addAllMissingImportsAdded = false;

        for (let diagnostic of context.diagnostics) {
            switch (true) {
                case !!(match = isMissingImport(diagnostic)):
                    let infos = this.resolveIndex.declarationInfos.filter(o => o.declaration.name === match[1]);
                    if (infos.length > 0) {
                        for (let info of infos) {
                            commands.push(this.createCommand(
                                `Import "${info.declaration.name}" from "${info.from}".`,
                                new AddImportCodeAction(document, info)
                            ));
                        }
                        if (!addAllMissingImportsAdded) {
                            commands.push(this.createCommand(
                                'Add all missing imports if possible.',
                                new AddMissingImportsCodeAction(document, this.resolveIndex)
                            ));
                            addAllMissingImportsAdded = true;
                        }
                    } else {
                        commands.push(this.createCommand(
                            `Cannot find "${match[1]}" in the index.`,
                            new NoopCodeAction()
                        ));
                    }
                    break;
                case !!(match = isIncorrectlyImplementingInterface(diagnostic)):
                case !!(match = isIncorrectlyImplementingAbstract(diagnostic)):
                    let parsedDocument = await this.parser.parseSource(document.getText()),
                        alreadyImported = parsedDocument.imports.find(
                            o => o instanceof TsNamedImport && o.specifiers.some(s => s.specifier === match[2])
                        ),
                        declaration = parsedDocument.declarations.find(o => o.name === match[2]) ||
                            (this.resolveIndex.declarationInfos.find(
                                o => o.declaration.name === match[2] &&
                                    o.from === getAbsolutLibraryName(alreadyImported.libraryName, document.fileName)
                            ) || { declaration: undefined }).declaration;

                    if (commands.some((o: Command) => o.title.indexOf(match[2]) >= 0)) {
                        // Do leave the method when a command with the found class is already added.
                        break;
                    }

                    if (!declaration) {
                        commands.push(this.createCommand(
                            `Cannot find "${match[2]}" in the index or the actual file.`,
                            new NoopCodeAction()
                        ));
                        break;
                    }

                    commands.push(this.createCommand(
                        `Implement missing elements from "${match[2]}".`,
                        new ImplementPolymorphElements(document, match[1], declaration)
                    ));

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

/**
 * Determines if the problem is an incorrect implementation of an interface.
 * 
 * @param {Diagnostic} diagnostic
 * @returns {RegExpExecArray}
 */
function isIncorrectlyImplementingInterface(diagnostic: Diagnostic): RegExpExecArray {
    return /class ['"](.*)['"] incorrectly implements.*['"](.*)['"]\./ig.exec(diagnostic.message);
}

/**
 * Determines if the problem is missing implementations of an abstract class.
 * 
 * @param {Diagnostic} diagnostic
 * @returns {RegExpExecArray}
 */
function isIncorrectlyImplementingAbstract(diagnostic: Diagnostic): RegExpExecArray {
    return /non-abstract class ['"](.*)['"].*implement inherited.*from class ['"](.*)['"]\./ig.exec(diagnostic.message);
}
