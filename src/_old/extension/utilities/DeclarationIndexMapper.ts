import { inject, injectable, postConstruct } from 'inversify';
import { DeclarationIndex, FileChanges, TypescriptParser } from 'typescript-parser';
import {
  Event,
  EventEmitter,
  ExtensionContext,
  FileSystemWatcher,
  RelativePattern,
  Uri,
  workspace,
  WorkspaceFolder,
  WorkspaceFoldersChangeEvent,
} from 'vscode';

import { ConfigFactory } from '../../common/factories';
import { findFiles } from '../../common/helpers';
import { iocSymbols } from '../../extension/IoCSymbols';
import { Logger } from './winstonLogger';

interface WorkspaceIndex {
  index: DeclarationIndex;
  folder: WorkspaceFolder;
  watcher: FileSystemWatcher;
}

// TODO move did change configuration to all indices
// TODO: update index on change of configs

/**
 * Mapping class that manages the different indices for the workspaces.
 *
 * @export
 * @class DeclarationIndexMapper
 */
@injectable()
export class DeclarationIndexMapper {
  public readonly onStartIndexing: Event<WorkspaceIndex>;
  public readonly onFinishIndexing: Event<WorkspaceIndex>;
  public readonly onIndexingError: Event<{ index: WorkspaceIndex, error: Error }>;

  private _onStartIndexing: EventEmitter<WorkspaceIndex>;
  private _onFinishIndexing: EventEmitter<WorkspaceIndex>;
  private _onIndexingError: EventEmitter<{ index: WorkspaceIndex, error: Error }>;

  private indizes: { [uri: string]: WorkspaceIndex } = {};

  constructor(
    @inject(iocSymbols.logger) private logger: Logger,
    @inject(iocSymbols.extensionContext) private context: ExtensionContext,
    @inject(iocSymbols.typescriptParser) private parser: TypescriptParser,
    @inject(iocSymbols.configuration) private config: ConfigFactory,
  ) {
    this._onFinishIndexing = new EventEmitter();
    this._onStartIndexing = new EventEmitter();
    this._onIndexingError = new EventEmitter();

    this.onFinishIndexing = this._onFinishIndexing.event;
    this.onStartIndexing = this._onStartIndexing.event;
    this.onIndexingError = this._onIndexingError.event;

    this.context.subscriptions.push(this._onFinishIndexing);
    this.context.subscriptions.push(this._onIndexingError);
    this.context.subscriptions.push(this._onStartIndexing);
  }

  /**
   * Init method that runs after the DI construction of the object.
   *
   * @memberof DeclarationIndexMapper
   */
  @postConstruct()
  public initialize(): void {
    this.context.subscriptions.push(workspace.onDidChangeWorkspaceFolders(e => this.workspaceChanged(e)));
    this.logger.info(
      '[%s] initializing index mapper for %d workspaces',
      DeclarationIndexMapper.name,
      (workspace.workspaceFolders || []).length,
    );

    for (const folder of (workspace.workspaceFolders || []).filter(workspace => workspace.uri.scheme === 'file')) {
      this.initializeIndex(folder);
    }
    this.logger.info('[%s] initialized', DeclarationIndexMapper.name);
  }

  /**
   * Method to rebuild all indices in the system.
   *
   * @memberof DeclarationIndexMapper
   */
  public rebuildAll(): void {
    this.logger.info(
      '[%s] rebuilding all indices',
      DeclarationIndexMapper.name,
    );
    for (const index of Object.values(this.indizes)) {
      index.watcher.dispose();
      index.index.reset();
    }
    this.indizes = {};
    for (const folder of (workspace.workspaceFolders || []).filter(workspace => workspace.uri.scheme === 'file')) {
      this.initializeIndex(folder);
    }
  }

  /**
   * Returns the index (or undefined) for a given file URI.
   *
   * @param {Uri} fileUri
   * @returns {(DeclarationIndex | undefined)}
   * @memberof DeclarationIndexMapper
   */
  public getIndexForFile(fileUri: Uri): DeclarationIndex | undefined {
    const workspaceFolder = workspace.getWorkspaceFolder(fileUri);
    if (!workspaceFolder || !this.indizes[workspaceFolder.uri.fsPath]) {
      this.logger.debug(
        '[%s] did not find index for file',
        DeclarationIndexMapper.name,
        { file: fileUri.fsPath },
      );
      return;
    }

    return this.indizes[workspaceFolder.uri.fsPath].index;
  }

  /**
   * Eventhandler that is called when the workspaces changed (i.e. some where added or removed).
   *
   * @private
   * @param {WorkspaceFoldersChangeEvent} event
   * @memberof DeclarationIndexMapper
   */
  private workspaceChanged(event: WorkspaceFoldersChangeEvent): void {
    this.logger.info(
      '[%s] workspaces changed, adjusting indices',
      DeclarationIndexMapper.name,
    );
    for (const add of event.added) {
      this.logger.debug(
        '[%s] add workspace for "%s"',
        DeclarationIndexMapper.name,
        add.uri.fsPath,
      );
      if (this.indizes[add.uri.fsPath]) {
        this.logger.warn(
          '[%s] workspace index "%s" already exists, skipping',
          DeclarationIndexMapper.name,
          add.uri.fsPath,
        );
        continue;
      }
      this.initializeIndex(add);
    }

    for (const remove of event.removed) {
      this.logger.debug(
        '[%s] remove workspace for "%s"',
        DeclarationIndexMapper.name,
        remove.uri.fsPath,
      );
      this.indizes[remove.uri.fsPath].index.reset();
      this.indizes[remove.uri.fsPath].watcher.dispose();
      delete this.indizes[remove.uri.fsPath];
    }
  }

  /**
   * Helper method to initialize an index.
   *
   * @private
   * @param {WorkspaceFolder} folder
   * @returns {Promise<void>}
   * @memberof DeclarationIndexMapper
   */
  private async initializeIndex(folder: WorkspaceFolder): Promise<void> {
    const profiler = this.logger.startTimer();
    this.logger.debug(
      '[%s] initialize index for "%s"',
      DeclarationIndexMapper.name,
      folder.uri.fsPath,
    );
    const index = new DeclarationIndex(this.parser, folder.uri.fsPath);
    const config = this.config(folder.uri);
    const files = await findFiles(config, folder);
    const watcher = workspace.createFileSystemWatcher(
      new RelativePattern(
        folder,
        `{${config.resolver.resolverModeFileGlobs.join(',')},**/package.json,**/typings.json}`,
      ),
    );
    const workspaceIndex = {
      index,
      folder,
      watcher,
    };

    this._onStartIndexing.fire(workspaceIndex);

    let timeout: NodeJS.Timer | undefined;
    let events: FileChanges | undefined;

    const fileWatcherEvent = (event: string, uri: Uri) => {
      if (timeout) {
        clearTimeout(timeout);
      }
      if (!events) {
        events = {
          created: [],
          updated: [],
          deleted: [],
        };
      }
      events[event].push(uri.fsPath);

      timeout = setTimeout(
        async () => {
          if (events) {
            const profiler = this.logger.startTimer();
            this.logger.debug(
              '[%s] rebuilding index for index "%s"',
              DeclarationIndexMapper.name,
              folder.uri.fsPath,
            );
            await index.reindexForChanges(events);
            profiler.done({
              message: `[${DeclarationIndexMapper.name}] rebuilt index for workspace "${folder.name}"`,
            });
            events = undefined;
          }
        },
        500,
      );
    };

    watcher.onDidCreate(uri => fileWatcherEvent('created', uri));
    watcher.onDidChange(uri => fileWatcherEvent('updated', uri));
    watcher.onDidDelete(uri => fileWatcherEvent('deleted', uri));

    try {
      await index.buildIndex(files);
      this.indizes[folder.uri.fsPath] = workspaceIndex;
      this._onFinishIndexing.fire(workspaceIndex);
      profiler.done({
        message: `[${DeclarationIndexMapper.name}] built index for workspace "${folder.name}"`,
      });
    } catch (error) {
      this.logger.error(
        '[%s] could not build index for workspace "%s", error: %s',
        DeclarationIndexMapper.name,
        folder.uri.fsPath,
        error,
      );
      this._onIndexingError.fire({ error, index: workspaceIndex });
    }
  }
}
