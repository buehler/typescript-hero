import { inject, injectable, postConstruct } from 'inversify';
import { DeclarationIndex } from 'typescript-parser';
import {
  Disposable,
  ExtensionContext,
  StatusBarAlignment,
  StatusBarItem,
  Uri,
  window,
  workspace,
  WorkspaceFolder,
  WorkspaceFoldersChangeEvent,
} from 'vscode';

import iocSymbols from '../ioc-symbols';
import { Logger } from '../utilities/logger';
import WorkspaceDeclarations, { WorkspaceDeclarationsState } from './workspace-declarations';

enum ResolverState {
  ok = 'TSH Resolver $(check)',
  syncing = 'TSH Resolver $(sync)',
  error = 'TSH Resolver $(flame)',
}

@injectable()
export default class DeclarationManager implements Disposable {
  private readonly workspaces: { [uri: string]: WorkspaceDeclarations } = {};
  private statusBarItem: StatusBarItem;
  private activeWorkspaces: number = 0;

  constructor(
    @inject(iocSymbols.extensionContext) private context: ExtensionContext,
    @inject(iocSymbols.logger) private logger: Logger,
  ) { }

  @postConstruct()
  public setup(): void {
    this.logger.debug('[DeclarationManager] Setting up DeclarationManager.');
    this.statusBarItem = window.createStatusBarItem(StatusBarAlignment.Left, 4);
    this.statusBarItem.text = ResolverState.ok;
    this.statusBarItem.show();

    this.context.subscriptions.push(this);
    this.context.subscriptions.push(this.statusBarItem);
    this.context.subscriptions.push(workspace.onDidChangeWorkspaceFolders(e => this.workspaceFoldersChanged(e)));

    for (const folder of (workspace.workspaceFolders || []).filter(workspace => workspace.uri.scheme === 'file')) {
      this.createWorkspace(folder);
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
    if (!workspaceFolder || !this.workspaces[workspaceFolder.uri.fsPath]) {
      this.logger.debug('[DeclarationManager] Did not find index for file', { file: fileUri.fsPath });
      return;
    }

    return this.workspaces[workspaceFolder.uri.fsPath].index;
  }

  public dispose(): void {
    this.logger.debug('[DeclarationManager] Disposing DeclarationManager.');
    for (const folder of Object.values(this.workspaces)) {
      folder.dispose();
    }
  }

  /**
   * Eventhandler that is called when the workspaces changed (i.e. some where added or removed).
   *
   * @private
   * @param {WorkspaceFoldersChangeEvent} event
   * @memberof DeclarationIndexMapper
   */
  private workspaceFoldersChanged(event: WorkspaceFoldersChangeEvent): void {
    const added = event.added.filter(e => e.uri.scheme === 'file');
    const removed = event.removed.filter(e => e.uri.scheme === 'file');

    this.logger.info(
      '[DeclarationManager] Workspaces changed, adjusting indices',
      { added: added.map(e => e.uri.fsPath), removed: removed.map(e => e.uri.fsPath) },
    );

    for (const add of event.added) {
      if (this.workspaces[add.uri.fsPath]) {
        this.logger.warn(
          '[DeclarationManager] Workspace index already exists, skipping',
          { workspace: add.uri.fsPath },
        );
        continue;
      }
      this.createWorkspace(add);
    }

    for (const remove of event.removed) {
      this.workspaces[remove.uri.fsPath].dispose();
      delete this.workspaces[remove.uri.fsPath];
    }
  }

  private workspaceStateChanged(state: WorkspaceDeclarationsState): void {
    if (this.statusBarItem.text === ResolverState.error) {
      return;
    }
    if (state === WorkspaceDeclarationsState.Error) {
      this.logger.error('[DeclarationManager] A workspace did encounter an error.');
      this.statusBarItem.text = ResolverState.error;
      return;
    }
    if (state === WorkspaceDeclarationsState.Syncing) {
      this.logger.debug('[DeclarationManager] A workspace is syncing it\'s files.');
      this.activeWorkspaces++;
      this.statusBarItem.text = ResolverState.syncing;
      return;
    }
    if (state === WorkspaceDeclarationsState.Idle) {
      this.logger.debug('[DeclarationManager] A workspace is done syncing it\'s files.');
      this.activeWorkspaces--;
    }
    if (this.activeWorkspaces <= 0) {
      this.activeWorkspaces = 0;
      this.logger.debug('[DeclarationManager] All workspaces are done syncing.');
      this.statusBarItem.text = ResolverState.ok;
    }
  }

  private createWorkspace(folder: WorkspaceFolder): void {
    this.workspaces[folder.uri.fsPath] = new WorkspaceDeclarations(folder);
    this.workspaces[folder.uri.fsPath].workspaceStateChanged(state => this.workspaceStateChanged(state));
    this.workspaces[folder.uri.fsPath].initialize();
  }
}
