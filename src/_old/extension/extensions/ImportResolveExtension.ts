import { inject, injectable } from 'inversify';
import { DeclarationInfo, TypescriptParser } from 'typescript-parser';
import { commands, ExtensionContext, StatusBarAlignment, StatusBarItem, window, workspace } from 'vscode';

import { getDeclarationsFilteredByImports } from '../../common/helpers';
import { iocSymbols } from '../IoCSymbols';
import { ImportManager } from '../managers';
import { DeclarationIndexMapper } from '../utilities/DeclarationIndexMapper';
import { getScriptKind } from '../utilities/utilityFunctions';
import { Logger } from '../utilities/winstonLogger';
import { BaseExtension } from './BaseExtension';

type MissingDeclarationsForFileOptions = { documentSource: string, documentPath: string };

const resolverOk = 'TSH Resolver $(check)';
const resolverSyncing = 'TSH Resolver $(sync)';
const resolverErr = 'TSH Resolver $(flame)';

/**
 * Extension that resolves imports. Contains various actions to add imports to a document, add missing
 * imports and organize imports. Also can rebuild the symbol cache.
 *
 * @export
 * @class ImportResolveExtension
 * @extends {BaseExtension}
 */
@injectable()
export class ImportResolveExtension extends BaseExtension {
  private statusBarItem: StatusBarItem = window.createStatusBarItem(StatusBarAlignment.Left, 4);

  constructor(
    @inject(iocSymbols.extensionContext) context: ExtensionContext,
    @inject(iocSymbols.logger) private logger: Logger,
    @inject(iocSymbols.typescriptParser) private parser: TypescriptParser,
    @inject(iocSymbols.declarationIndexMapper) private indices: DeclarationIndexMapper,
  ) {
    super(context);
  }

  /**
   * Initialized the extension. Registers the commands and other disposables to the context.
   *
   * @memberof ImportResolveExtension
   */
  public initialize(): void {
    this.context.subscriptions.push(this.statusBarItem);

    this.statusBarItem.text = resolverOk;
    this.statusBarItem.tooltip = 'Click to manually reindex all files';
    this.statusBarItem.command = 'typescriptHero.resolve.rebuildCache';
    this.context.subscriptions.push(this.indices.onStartIndexing(() => {
      this.statusBarItem.text = resolverSyncing;
    }));
    this.context.subscriptions.push(this.indices.onFinishIndexing(() => {
      this.statusBarItem.text = resolverOk;
    }));
    this.context.subscriptions.push(this.indices.onIndexingError(() => {
      this.statusBarItem.text = resolverErr;
    }));
    this.statusBarItem.show();

    this.commandRegistrations();

    this.logger.info('[%s] initialized', ImportResolveExtension.name);
  }

  /**
   * Disposes the extension.
   *
   * @memberof ImportResolveExtension
   */
  public dispose(): void {
    this.logger.info('[%s] disposed', ImportResolveExtension.name);
  }

  /**
   * Adds all missing imports to the actual document if possible. If multiple declarations are found,
   * a quick pick list is shown to the user and he needs to decide, which import to use.
   *
   * @private
   * @returns {Promise<void>}
   *
   * @memberof ImportResolveExtension
   */
  private async addMissingImports(): Promise<void> {
    if (!window.activeTextEditor) {
      return;
    }
    const index = this.indices.getIndexForFile(window.activeTextEditor.document.uri);
    if (!index || !index.indexReady) {
      this.showCacheWarning();
      return;
    }
    try {
      this.logger.debug(
        '[%s] add all missing imports to the document',
        ImportResolveExtension.name,
        { file: window.activeTextEditor.document.fileName },
      );
      const missing = await this.getMissingDeclarationsForFile({
        documentSource: window.activeTextEditor.document.getText(),
        documentPath: window.activeTextEditor.document.fileName,
      });

      if (missing && missing.length) {
        const ctrl = await ImportManager.create(window.activeTextEditor.document);
        missing.filter(o => o instanceof DeclarationInfo).forEach(o => ctrl.addDeclarationImport(<any>o));
        await ctrl.commit();
      }
    } catch (e) {
      this.logger.error(
        '[%s] missing imports could not be added, error: %s',
        ImportResolveExtension.name,
        e,
        { file: window.activeTextEditor.document.fileName },
      );
      window.showErrorMessage('The operation cannot be completed, there was an error during the process.');
    }
  }

  /**
   * Organizes the imports of the actual document. Sorts and formats them correctly.
   *
   * @private
   * @returns {Promise<boolean>}
   *
   * @memberof ImportResolveExtension
   */
  private async organizeImports(): Promise<boolean> {
    if (!window.activeTextEditor) {
      return false;
    }
    try {
      this.logger.debug(
        '[%s] organize the imports in the document',
        ImportResolveExtension.name,
        { file: window.activeTextEditor.document.fileName },
      );
      const ctrl = await ImportManager.create(window.activeTextEditor.document);
      return await ctrl.organizeImports().commit();
    } catch (e) {
      this.logger.error(
        '[%s] imports could not be organized, error: %s',
        ImportResolveExtension.name,
        e,
        { file: window.activeTextEditor.document.fileName },
      );
      return false;
    }
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
    const ctrl = await ImportManager.create(window.activeTextEditor.document);
    return await ctrl.addDeclarationImport(declaration).commit();
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
      '[%s] index was not ready or not index for this file found',
      ImportResolveExtension.name,
    );
    window.showWarningMessage('Please wait a few seconds longer until the symbol cache has been build.');
  }

  /**
   * Calculates the missing imports of a document. Parses the documents source and then
   * tries to resolve all possible declaration infos for the usages (used identifiers).
   *
   * @private
   * @param {MissingDeclarationsForFileOptions} {documentSource, documentPath}
   * @returns {(Promise<(DeclarationInfo | ImportUserDecision)[]>)}
   *
   * @memberof ImportResolveExtension
   */
  private async getMissingDeclarationsForFile(
    { documentSource, documentPath }: MissingDeclarationsForFileOptions,
  ): Promise<(DeclarationInfo)[]> {
    if (!window.activeTextEditor) {
      return [];
    }

    const index = this.indices.getIndexForFile(window.activeTextEditor.document.uri);
    const rootFolder = workspace.getWorkspaceFolder(window.activeTextEditor.document.uri);

    if (!index || !index.indexReady || !rootFolder) {
      return [];
    }

    this.logger.debug(
      '[%s] calculate missing imports for document',
      ImportResolveExtension.name,
      { file: documentPath },
    );

    const parsedDocument = await this.parser.parseSource(documentSource, getScriptKind(documentPath));
    const missingDeclarations: (DeclarationInfo)[] = [];
    const declarations = getDeclarationsFilteredByImports(
      index.declarationInfos,
      documentPath,
      parsedDocument.imports,
      rootFolder.uri.fsPath,
    );

    for (const usage of parsedDocument.nonLocalUsages) {
      const foundDeclarations = declarations.filter(o => o.declaration.name === usage);
      if (foundDeclarations.length <= 0) {
        continue;
      } else if (foundDeclarations.length === 1) {
        missingDeclarations.push(foundDeclarations[0]);
      } else {
        // TODO handle decisions.
        // missingDeclarations.push(...foundDeclarations.map(o => new ImportUserDecision(o, usage)));
      }
    }

    return missingDeclarations;
  }

  /**
   * Registers the commands for this extension.
   *
   * @private
   * @memberof ImportResolveExtension
   */
  private commandRegistrations(): void {

    this.context.subscriptions.push(
      commands.registerTextEditorCommand(
        'typescriptHero.resolve.addMissingImports', () => this.addMissingImports(),
      ),
    );
    this.context.subscriptions.push(
      commands.registerTextEditorCommand('typescriptHero.resolve.organizeImports', () => this.organizeImports()),
    );
    this.context.subscriptions.push(
      commands.registerCommand('typescriptHero.resolve.rebuildCache', () => this.indices.rebuildAll()),
    );
  }
}
