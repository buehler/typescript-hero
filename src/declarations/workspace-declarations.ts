import { exists } from 'fs-extra';
import { join } from 'path';
import { DeclarationIndex, FileChanges, TypescriptParser } from 'typescript-parser';
import { Disposable, Event, EventEmitter, RelativePattern, Uri, workspace, WorkspaceFolder } from 'vscode';

import Configuration from '../configuration';
import ioc from '../ioc';
import iocSymbols from '../ioc-symbols';
import { Logger } from '../utilities/logger';

export const enum WorkspaceDeclarationsState {
  Idle,
  Syncing,
  Error,
}

export default class WorkspaceDeclarations implements Disposable {
  private readonly _workspaceStateChanged: EventEmitter<WorkspaceDeclarationsState> = new EventEmitter();
  private readonly disposables: Disposable[] = [];
  private watcherEvents: FileChanges | undefined;
  private timeout: NodeJS.Timer | undefined;
  private _index: DeclarationIndex;

  public get workspaceStateChanged(): Event<WorkspaceDeclarationsState> {
    return this._workspaceStateChanged.event;
  }

  public get index(): DeclarationIndex {
    return this._index;
  }

  private get parser(): TypescriptParser {
    return ioc.get<TypescriptParser>(iocSymbols.parser);
  }

  private get logger(): Logger {
    return ioc.get<Logger>(iocSymbols.logger);
  }

  private get config(): Configuration {
    return ioc.get<Configuration>(iocSymbols.configuration);
  }

  constructor(
    private readonly folder: WorkspaceFolder,
  ) {
    this.logger.debug('Creating workspace declarations index.', { workspace: this.folder.uri.fsPath });
    this.disposables.push(this._workspaceStateChanged);
    this.initialize();
  }

  public dispose(): void {
    this.logger.debug('Disposing workspace declarations index.', { workspace: this.folder.uri.fsPath });
    for (const disposable of this.disposables) {
      disposable.dispose();
    }
    this._index.reset();
  }

  private async initialize(): Promise<void> {
    const profiler = this.logger.startTimer();
    this._workspaceStateChanged.fire(WorkspaceDeclarationsState.Syncing);

    this._index = new DeclarationIndex(this.parser, this.folder.uri.fsPath);
    const files = await this.findFiles();
    this.logger.info(`Found ${files.length} files in workspace.`, { workspace: this.folder.uri.fsPath });
    const watcher = workspace.createFileSystemWatcher(
      new RelativePattern(
        this.folder,
        '{**/*.ts,**/*.tsx,**/package.json,**/typings.json}',
      ),
    );

    watcher.onDidChange(uri => this.fileWatcherEvent('created', uri));
    watcher.onDidChange(uri => this.fileWatcherEvent('updated', uri));
    watcher.onDidDelete(uri => this.fileWatcherEvent('deleted', uri));

    this.disposables.push(watcher);

    try {
      await this._index.buildIndex(files);
      this._workspaceStateChanged.fire(WorkspaceDeclarationsState.Idle);

      profiler.done({
        message: 'Built index for workspace.',
        workspace: this.folder.uri.fsPath,
      });
    } catch (error) {
      this._workspaceStateChanged.fire(WorkspaceDeclarationsState.Error);
      this.logger.error(
        'Error during indexing of workspacefiles.',
        { error: error.toString(), workspace: this.folder.uri.fsPath },
      );
    }
  }

  private fileWatcherEvent(event: string, uri: Uri): void {
    if (this.timeout) {
      clearTimeout(this.timeout);
    }
    if (!this.watcherEvents) {
      this.watcherEvents = {
        created: [],
        updated: [],
        deleted: [],
      };
    }
    this.watcherEvents[event].push(uri.fsPath);

    this.timeout = setTimeout(
      async () => {
        if (this.watcherEvents) {
          const profiler = this.logger.startTimer();
          this.logger.debug(
            'Rebuilding index for workspace',
            { workspace: this.folder.uri.fsPath },
          );
          this._workspaceStateChanged.fire(WorkspaceDeclarationsState.Syncing);
          try {
            await this._index.reindexForChanges(this.watcherEvents);
            profiler.done({
              message: 'Rebuilt index for workspace',
              workspace: this.folder.uri.fsPath,
            });
            this._workspaceStateChanged.fire(WorkspaceDeclarationsState.Idle);
          } catch (e) {
            this._workspaceStateChanged.fire(WorkspaceDeclarationsState.Error);
            this.logger.error('Error during reindex of workspacefiles', { workspace: this.folder.uri.fsPath });
          } finally {
            this.watcherEvents = undefined;
          }
        }
      },
      500,
    );
  }

  /**
   * This function searches for files in a specific workspace folder. The files are relative to the given
   * workspace folder.
   *
   * If a node_modules folder is present, but NO package.json, the node_modules are ignored completely.
   * (For performance and memory reasons)
   *
   * @returns {Promise<string[]>}
   */
  private async findFiles(): Promise<string[]> {
    const workspaceExcludes = [
      ...this.config.index.workspaceIgnorePatterns(this.folder.uri),
      'node_modules/**/*',
      'typings/**/*',
    ];
    const moduleExcludes = this.config.index.moduleIgnorePatterns(this.folder.uri);
    this.logger.debug('Calculated excludes for workspace.', {
      workspaceExcludes,
      moduleExcludes,
      workspace: this.folder.uri.fsPath,
    });

    const searches: PromiseLike<Uri[]>[] = [
      workspace.findFiles(
        new RelativePattern(this.folder, '{**/*.ts,**/*.tsx}'),
        new RelativePattern(this.folder, `{${workspaceExcludes.join(',')}}`),
      ),
    ];

    const rootPath = this.folder.uri.fsPath;
    const hasPackageJson = await exists(join(rootPath, 'package.json'));

    if (rootPath && hasPackageJson) {
      this.logger.debug('Found package.json, calculate searchable node modules.', {
        workspace: this.folder.uri.fsPath,
        packageJson: join(rootPath, 'package.json'),
      });
      let globs: string[] = [];
      let ignores: string[] = [];

      const packageJson = require(join(rootPath, 'package.json'));
      for (const folder of ['dependencies', 'devDependencies']) {
        if (packageJson[folder]) {
          globs = globs.concat(
            Object.keys(packageJson[folder]).map(o => `node_modules/${o}/**/*.d.ts`),
          );
          ignores = ignores.concat(
            Object.keys(packageJson[folder]).reduce(
              (all, pkg) => {
                return all.concat(
                  moduleExcludes.map(exclude => `node_modules/${pkg}/${exclude}`),
                );
              },
              [] as string[],
            ),
          );
        }
      }

      this.logger.debug('Calculated node module search.', {
        globs,
        ignores,
        workspace: this.folder.uri.fsPath,
      });

      searches.push(
        workspace.findFiles(
          new RelativePattern(this.folder, `{${globs.join(',')}}`),
          new RelativePattern(this.folder, `{${ignores.join(',')}}`),
        ),
      );
    }

    const uris = await Promise.all(searches);
    return uris
      .reduce((all, cur) => all.concat(cur), [])
      .map(o => o.fsPath);
  }
}
