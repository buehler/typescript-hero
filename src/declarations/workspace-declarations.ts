import { DeclarationIndex, TypescriptParser } from 'typescript-parser';
import { Disposable, Event, EventEmitter, WorkspaceFolder } from 'vscode';

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
  }

  private initialize(): void {
    const profiler = this.logger.startTimer();
    this._index = new DeclarationIndex(this.parser, this.folder.uri.fsPath);

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
      ...config.resolver.workspaceIgnorePatterns,
      'node_modules/**/*',
      'typings/**/*',
    ];
    const moduleExcludes = config.resolver.moduleIgnorePatterns;
    const searches: PromiseLike<Uri[]>[] = [
      workspace.findFiles(
        new RelativePattern(workspaceFolder, `{${config.resolver.resolverModeFileGlobs.join(',')}}`),
        new RelativePattern(workspaceFolder, `{${workspaceExcludes.join(',')}}`),
      ),
    ];

    // TODO: check the package json and index javascript file in node_modules (?)
    let globs: string[] = ['typings/**/*.d.ts'];
    let ignores: string[] = [];
    const rootPath = workspaceFolder.uri.fsPath;
    const hasPackageJson = existsSync(join(rootPath, 'package.json'));

    if (rootPath && hasPackageJson) {
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
    } else {
      ignores.push('node_modules/**/*');
    }

    searches.push(
      workspace.findFiles(
        new RelativePattern(workspaceFolder, `{${globs.join(',')}}`),
        new RelativePattern(workspaceFolder, `{${ignores.join(',')}}`),
      ),
    );

    const uris = await Promise.all(searches);
    return uris
      .reduce((all, cur) => all.concat(cur), [])
      .map(o => o.fsPath);
  }
}
