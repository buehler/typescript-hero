import { inject, injectable } from 'inversify';
import { DeclarationInfo, TypescriptParser } from 'typescript-parser';
import {
  CancellationToken,
  commands,
  CompletionItem,
  CompletionItemProvider,
  ExtensionContext,
  languages,
  Position,
  TextDocument,
  workspace,
} from 'vscode';

import Activatable from '../activatable';
import Configuration from '../configuration';
import DeclarationManager from '../declarations/declaration-manager';
import iocSymbols, { ImportManagerProvider } from '../ioc-symbols';
import { Logger } from '../utilities/logger';
import { getDeclarationsFilteredByImports, getItemKind, getScriptKind } from '../utilities/utility-functions';

const REGEX_COMMENT = /^\s*(?:\/\/|\/\*|\*\/|\*)/;

/**
 * Extension that provides code completion for typescript and javascript files.
 * Uses the calculated index to provide information.
 *
 * @export
 * @class CodeCompletion
 * @implements {Activatable}
 * @implements {CompletionItemProvider}
 */
@injectable()
export class CodeCompletion implements Activatable, CompletionItemProvider {

  constructor(
    @inject(iocSymbols.extensionContext) private context: ExtensionContext,
    @inject(iocSymbols.logger) private logger: Logger,
    @inject(iocSymbols.configuration) private config: Configuration,
    @inject(iocSymbols.importManager) private importManagerProvider: ImportManagerProvider,
    @inject(iocSymbols.declarationManager) private declarationManager: DeclarationManager,
    @inject(iocSymbols.parser) private parser: TypescriptParser,
  ) { }

  public setup(): void {
    this.logger.debug('[CodeCompletion] Setting up CodeCompletion.');
    this.logger.debug(
      '[CodeCompletion] Registering for languages.',
      { languages: this.config.parseableLanguages() },
    );

    for (const lang of this.config.parseableLanguages()) {
      this.context.subscriptions.push(languages.registerCompletionItemProvider(lang, this));
    }

    this.context.subscriptions.push(
      commands.registerCommand(
        'typescriptHero.codeCompletion.executeIntellisenseItem',
        (document: TextDocument, declaration: DeclarationInfo) =>
          this.executeIntellisenseItem(document, declaration),
      ),
    );
  }

  public start(): void {
    this.logger.info('[CodeCompletion] Starting up CodeCompletion.');
  }

  public stop(): void {
    this.logger.info('[CodeCompletion] Stopping CodeCompletion.');
  }

  public dispose(): void {
    this.logger.debug('[CodeCompletion] Disposing CodeCompletion.');
  }

  public async provideCompletionItems(
    document: TextDocument,
    position: Position,
    token: CancellationToken,
  ): Promise<CompletionItem[] | null> {
    const index = this.declarationManager.getIndexForFile(document.uri);
    const actualWorkspace = workspace.getWorkspaceFolder(document.uri);

    if (!index || !actualWorkspace || !index.indexReady) {
      this.logger.info('[CodeCompletion] index not ready or no workspace folder selected');
      return null;
    }

    const wordAtPosition = document.getWordRangeAtPosition(position);
    const lineText = document.lineAt(position.line).text;

    let searchWord = '';

    if (wordAtPosition && wordAtPosition.start.character < position.character) {
      const word = document.getText(wordAtPosition);
      searchWord = word.substr(0, position.character - wordAtPosition.start.character);
    }

    if (
      !searchWord ||
      token.isCancellationRequested ||
      (lineText.substring(0, position.character).match(/["'`]/g) || []).length % 2 === 1 ||
      REGEX_COMMENT.test(lineText) ||
      lineText.startsWith('import ') ||
      new RegExp(`(?:\w*\.)+${searchWord}`).test(lineText.substring(0, position.character))
    ) {
      this.logger.debug(
        '[CodeCompletion] did not match criteria to provide intellisense',
        { searchWord, lineText, indexReady: index.indexReady },
      );
      return null;
    }

    this.logger.debug(`[CodeCompletion] provide code completion for "${searchWord}"`);
    const profiler = this.logger.startTimer();

    const parsed = await this.parser.parseSource(document.getText(), getScriptKind(document.fileName));
    const declarations = getDeclarationsFilteredByImports(
      index.declarationInfos,
      document.fileName,
      parsed.imports,
      actualWorkspace.uri.fsPath,
    )
      .filter(o => !parsed.declarations.some(d => d.name === o.declaration.name))
      .filter(o => !parsed.usages.some(d => d === o.declaration.name));

    const items: CompletionItem[] = [];
    for (const declaration of declarations.filter(
      o => o.declaration.name.toLowerCase().indexOf(searchWord.toLowerCase()) >= 0)
    ) {
      const item = new CompletionItem(declaration.declaration.name, getItemKind(declaration.declaration));

      item.detail = declaration.from;
      item.command = {
        arguments: [document, declaration],
        title: 'Execute intellisense insert',
        command: 'typescriptHero.codeCompletion.executeIntellisenseItem',
      };
      if (this.config.codeCompletion.completionSortMode(document.uri) === 'bottom') {
        item.sortText = `9999-${declaration.declaration.name}`;
      }
      items.push(item);
    }

    profiler.done({ message: `[CodeCompletion] calculated code completions` });
    return items;
  }

  /**
   * Executes a intellisense item that provided a document and a declaration to add.
   * Does make the calculation of the text edits async.
   *
   * @private
   * @param {TextDocument} document
   * @param {DeclarationInfo} declaration
   * @returns {Promise<void>}
   * @memberof CodeCompletion
   */
  private async executeIntellisenseItem(document: TextDocument, declaration: DeclarationInfo): Promise<void> {
    this.logger.info(
      '[CodeCompletion] Execute code completion action.',
      { specifier: declaration.declaration.name, library: declaration.from },
    );
    await (await this.importManagerProvider(document)).addDeclarationImport(declaration).commit();
  }
}
