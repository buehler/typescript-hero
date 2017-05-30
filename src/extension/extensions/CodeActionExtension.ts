import { getAbsolutLibraryName } from '../../common/helpers';
import { TypescriptParser } from '../../common/ts-parsing';
import { InterfaceDeclaration } from '../../common/ts-parsing/declarations';
import { NamedImport } from '../../common/ts-parsing/imports';
import { Logger, LoggerFactory } from '../../common/utilities';
import {
    AddImportCodeAction,
    AddMissingImportsCodeAction,
    CodeAction,
    ImplementPolymorphElements,
    NoopCodeAction,
} from '../code-actions/CodeAction';
import { CalculatedDeclarationIndex } from '../declarations/CalculatedDeclarationIndex';
import { iocSymbols } from '../IoCSymbols';
import { BaseExtension } from './BaseExtension';
import { inject, injectable } from 'inversify';
import {
    CancellationToken,
    CodeActionContext,
    CodeActionProvider,
    Command,
    commands,
    Diagnostic,
    ExtensionContext,
    languages,
    Range,
    TextDocument,
    window,
    workspace,
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
        private index: CalculatedDeclarationIndex,
        private parser: TypescriptParser,
    ) {
        super(context);
        this.logger = loggerFactory('CodeActionExtension');
    }

    /**
     * Initialized the extension. Registers the commands and other disposables to the context.
     * 
     * @memberOf ImportResolveExtension
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
     * @memberOf ImportResolveExtension
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
     * @memberOf CodeActionExtension
     */
    public async provideCodeActions(
        document: TextDocument,
        _range: Range,
        context: CodeActionContext,
        _token: CancellationToken,
    ): Promise<Command[]> {
        const commands: Command[] = [];
        let matchfoo: RegExpExecArray | null;
        let addAllMissingImportsAdded = false;

        for (const diagnostic of context.diagnostics) {
            switch (true) {
                case !!(matchfoo = isMissingImport(diagnostic)):
                    const match = isMissingImport(diagnostic)!;
                    if (!match) {
                        break;
                    }
                    const infos = this.index.declarationInfos.filter(o => o.declaration.name === match[1]);
                    if (infos.length > 0) {
                        for (const info of infos) {
                            commands.push(this.createCommand(
                                `Import "${info.declaration.name}" from "${info.from}".`,
                                new AddImportCodeAction(document, info),
                            ));
                        }
                        if (!addAllMissingImportsAdded) {
                            commands.push(this.createCommand(
                                'Add all missing imports if possible.',
                                new AddMissingImportsCodeAction(document, this.index),
                            ));
                            addAllMissingImportsAdded = true;
                        }
                    } else {
                        commands.push(this.createCommand(
                            `Cannot find "${match[1]}" in the index.`,
                            new NoopCodeAction(),
                        ));
                    }
                    break;
                case !!(matchfoo = isIncorrectlyImplementingInterface(diagnostic)):
                case !!(matchfoo = isIncorrectlyImplementingAbstract(diagnostic)):
                    const match2 = isMissingImport(diagnostic)!;
                    if (!match2) {
                        break;
                    }
                    const parsedDocument = await this.parser.parseSource(document.getText());
                    const alreadyImported = parsedDocument.imports.find(
                        o => o instanceof NamedImport && o.specifiers.some(s => s.specifier === match2[2]),
                    );
                    const declaration = parsedDocument.declarations.find(o => o.name === match2[2]) ||
                        (this.index.declarationInfos.find(
                            o => o.declaration.name === match2[2] &&
                                o.from === getAbsolutLibraryName(alreadyImported!.libraryName, document.fileName, workspace.rootPath),
                        ) || { declaration: undefined }).declaration;

                    if (commands.some((o: Command) => o.title.indexOf(match2[2]) >= 0)) {
                        // Do leave the method when a command with the found class is already added.
                        break;
                    }

                    if (!declaration) {
                        commands.push(this.createCommand(
                            `Cannot find "${match2[2]}" in the index or the actual file.`,
                            new NoopCodeAction(),
                        ));
                        break;
                    }

                    commands.push(this.createCommand(
                        `Implement missing elements from "${match2[2]}".`,
                        new ImplementPolymorphElements(document, match2[1], <InterfaceDeclaration>declaration),
                    ));

                    break;
                default:
                    break;
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
     * @memberOf CodeFixExtension
     */
    private async executeCodeAction(codeAction: CodeAction): Promise<void> {
        if (!await codeAction.execute()) {
            window.showWarningMessage('The provided code action could not complete. Please see the logs.');
        }
    }

    /**
     * Creates a customized command for the lightbulb with the correct strings.
     * 
     * @private
     * @param {string} title
     * @param {CodeAction} codeAction
     * @returns {Command}
     * 
     * @memberOf CodeActionExtension
     */
    private createCommand(title: string, codeAction: CodeAction): Command {
        return {
            arguments: [codeAction],
            command: 'typescriptHero.codeFix.executeCodeAction',
            title,
        };
    }
}

/**
 * Determines if the problem is a missing import.
 * 
 * @param {Diagnostic} diagnostic
 * @returns {RegExpExecArray}
 */
function isMissingImport(diagnostic: Diagnostic): RegExpExecArray | null {
    return /cannot find name ['"](.*)['"]/ig.exec(diagnostic.message);
}

/**
 * Determines if the problem is an incorrect implementation of an interface.
 * 
 * @param {Diagnostic} diagnostic
 * @returns {RegExpExecArray}
 */
function isIncorrectlyImplementingInterface(diagnostic: Diagnostic): RegExpExecArray | null {
    return /class ['"](.*)['"] incorrectly implements.*['"](.*)['"]\./ig.exec(diagnostic.message);
}

/**
 * Determines if the problem is missing implementations of an abstract class.
 * 
 * @param {Diagnostic} diagnostic
 * @returns {RegExpExecArray}
 */
function isIncorrectlyImplementingAbstract(diagnostic: Diagnostic): RegExpExecArray | null {
    return /non-abstract class ['"](.*)['"].*implement inherited.*from class ['"](.*)['"]\./ig.exec(diagnostic.message);
}
