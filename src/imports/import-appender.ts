import { inject, injectable } from 'inversify';
import { DeclarationInfo, TypescriptParser } from 'typescript-parser';
import { commands, ExtensionContext, window, workspace } from 'vscode';

import Activatable from '../activatable';
import DeclarationManager from '../declarations/declaration-manager';
import iocSymbols, { ImportManagerProvider } from '../ioc-symbols';
import { Logger } from '../utilities/logger';
import { getDeclarationsFilteredByImports, getScriptKind } from '../utilities/utility-functions';
import ImportQuickPickItem from './import-quick-pick-item';

type DeclarationsForImportOptions = { cursorSymbol: string, documentSource: string, documentPath: string };

@injectable()
export class ImportAppender implements Activatable {
  constructor(
    @inject(iocSymbols.extensionContext) private context: ExtensionContext,
    @inject(iocSymbols.logger) private logger: Logger,
    @inject(iocSymbols.importManager) private importManagerProvider: ImportManagerProvider,
    @inject(iocSymbols.declarationManager) private declarationManager: DeclarationManager,
    @inject(iocSymbols.parser) private parser: TypescriptParser,
  ) { }

  public setup(): void {
    this.logger.debug('[ImportAppender] Setting up ImportAppender.');
    this.context.subscriptions.push(
      commands.registerTextEditorCommand('typescriptHero.index.addImport', () => this.addImport()),
    );
    this.context.subscriptions.push(
      commands.registerTextEditorCommand(
        'typescriptHero.index.addImportUnderCursor',
        () => this.addImportUnderCursor(),
      ),
    );
  }

  public start(): void {
    this.logger.info('[ImportAppender] Starting up ImportAppender.');
  }

  public stop(): void {
    this.logger.info('[ImportAppender] Stopping ImportAppender.');
  }

  public dispose(): void {
    this.logger.debug('[ImportAppender] Disposing ImportAppender.');
  }

  /**
   * Add an import from the whole list. Calls the vscode gui, where the user can
   * select a symbol to import.
   *
   * @private
   * @returns {Promise<void>}
   *
   * @memberof ResolveExtension
   */
  private async addImport(): Promise<void> {
    if (!window.activeTextEditor) {
      return;
    }
    const index = this.declarationManager.getIndexForFile(window.activeTextEditor.document.uri);
    if (!index || !index.indexReady) {
      this.showCacheWarning();
      return;
    }
    try {
      const selectedItem = await window.showQuickPick(
        index.declarationInfos.map(o => new ImportQuickPickItem(o)),
        { placeHolder: 'Add import to document:' },
      );
      if (selectedItem) {
        this.logger.info(
          '[ImportAppender] Add import to document',
          { specifier: selectedItem.declarationInfo.declaration.name, library: selectedItem.declarationInfo.from },
        );
        this.addImportToDocument(selectedItem.declarationInfo);
      }
    } catch (e) {
      this.logger.error(
        '[ImportAppender] Import could not be added to document',
        { file: window.activeTextEditor.document.fileName, error: e.toString() },
      );
      window.showErrorMessage('The import cannot be completed, there was an error during the process.');
    }
  }

  /**
   * Add an import from the whole list. Calls the vscode gui, where the user can
   * select a symbol to import.
   *
   * @private
   * @returns {Promise<void>}
   *
   * @memberof ImportResolveExtension
   */
  private async addImportUnderCursor(): Promise<void> {
    if (!window.activeTextEditor) {
      return;
    }
    const index = this.declarationManager.getIndexForFile(window.activeTextEditor.document.uri);
    if (!index || !index.indexReady) {
      this.showCacheWarning();
      return;
    }
    try {
      const selectedSymbol = this.getSymbolUnderCursor();
      this.logger.debug('[ImportAppender] Add import for symbol under cursor', { selectedSymbol });
      if (!!!selectedSymbol) {
        return;
      }
      const resolveItems = await this.getDeclarationsForImport({
        cursorSymbol: selectedSymbol,
        documentSource: window.activeTextEditor.document.getText(),
        documentPath: window.activeTextEditor.document.fileName,
      });

      if (resolveItems.length < 1) {
        this.logger.info(
          '[ImportAppender] The symbol was not found or is already imported',
          { selectedSymbol },
        );
        window.showInformationMessage(
          `The symbol '${selectedSymbol}' was not found in the index or is already imported.`,
        );
      } else if (resolveItems.length === 1 && resolveItems[0].declaration.name === selectedSymbol) {
        this.logger.info(
          '[ImportAppender] Add import to document',
          {
            specifier: resolveItems[0].declaration.name,
            library: resolveItems[0].from,
          },
        );
        this.addImportToDocument(resolveItems[0]);
      } else {
        const selectedItem = await window.showQuickPick(
          resolveItems.map(o => new ImportQuickPickItem(o)), { placeHolder: 'Multiple declarations found:' },
        );
        if (selectedItem) {
          this.logger.info(
            '[ImportAppender] Add import to document',
            {
              specifier: selectedItem.declarationInfo.declaration.name,
              library: selectedItem.declarationInfo.from,
            },
          );
          this.addImportToDocument(selectedItem.declarationInfo);
        }
      }
    } catch (e) {
      this.logger.error(
        '[ImportAppender] Import could not be added to document.',
        { file: window.activeTextEditor.document.fileName, error: e.toString() },
      );
      window.showErrorMessage('The import cannot be completed, there was an error during the process.');
    }
  }

  /**
   * Calculates the possible imports for a given document source with a filter for the given symbol.
   * Returns a list of declaration infos that may be used for select picker or something.
   *
   * @private
   * @param {DeclarationsForImportOptions} {cursorSymbol, documentSource, documentPath}
   * @returns {(Promise<DeclarationInfo[] | undefined>)}
   *
   * @memberof ImportResolveExtension
   */
  private async getDeclarationsForImport(
    { cursorSymbol, documentSource, documentPath }: DeclarationsForImportOptions,
  ): Promise<DeclarationInfo[]> {
    if (!window.activeTextEditor) {
      return [];
    }

    const index = this.declarationManager.getIndexForFile(window.activeTextEditor.document.uri);
    const rootFolder = workspace.getWorkspaceFolder(window.activeTextEditor.document.uri);

    if (!index || !index.indexReady || !rootFolder) {
      return [];
    }

    this.logger.debug(
      '[ImportAppender] Calculate possible imports for document',
      { cursorSymbol, file: documentPath },
    );

    const parsedSource = await this.parser.parseSource(documentSource, getScriptKind(documentPath));
    const activeDocumentDeclarations = parsedSource.declarations.map(o => o.name);
    const declarations = getDeclarationsFilteredByImports(
      index.declarationInfos,
      documentPath,
      parsedSource.imports,
      rootFolder.uri.fsPath,
    ).filter(o => o.declaration.name.startsWith(cursorSymbol));

    return [
      ...declarations.filter(o => o.from.startsWith('/')),
      ...declarations.filter(o => !o.from.startsWith('/')),
    ].filter(o => activeDocumentDeclarations.indexOf(o.declaration.name) === -1);
  }

  /**
   * Returns the string under the cursor.
   *
   * @private
   * @returns {string}
   *
   * @memberof ImportResolveExtension
   */
  private getSymbolUnderCursor(): string {
    const editor = window.activeTextEditor;
    if (!editor) {
      return '';
    }
    const selection = editor.selection;
    const word = editor.document.getWordRangeAtPosition(selection.active);

    return word && !word.isEmpty ? editor.document.getText(word) : '';
  }

  /**
   * Effectifely adds an import quick pick item to a document
   *
   * @private
   * @param {DeclarationInfo} declaration
   * @returns {Promise<boolean>}
   *
   * @memberof ImportResolveExtension
   */
  private async addImportToDocument(declaration: DeclarationInfo): Promise<boolean> {
    if (!window.activeTextEditor) {
      return false;
    }
    const ctrl = await this.importManagerProvider(window.activeTextEditor.document);
    return ctrl.addDeclarationImport(declaration).commit();
  }

  /**
   * Shows a user warning if the resolve index is not ready yet.
   *
   * @private
   *
   * @memberof ImportResolveExtension
   */
  private showCacheWarning(): void {
    this.logger.warn(
      '[ImportAppender] Index was not ready or not index for this file found',
    );
    window.showWarningMessage('Please wait a few seconds longer until the symbol cache has been build.');
  }
}
