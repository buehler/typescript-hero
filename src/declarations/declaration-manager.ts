import { inject, injectable, postConstruct } from 'inversify';
import { DeclarationIndex } from 'typescript-parser';
import { Disposable, ExtensionContext, StatusBarAlignment, StatusBarItem, Uri, window, workspace } from 'vscode';

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
    this.logger.debug('Setting up DeclarationManager.');
    this.statusBarItem = window.createStatusBarItem(StatusBarAlignment.Left, 4);
    this.statusBarItem.text = ResolverState.ok;
    this.statusBarItem.show();

    this.context.subscriptions.push(this);
    this.context.subscriptions.push(this.statusBarItem);
    this.context.subscriptions.push(workspace.onDidChangeWorkspaceFolders(e => this.workspaceChanged(e)));

    for (const folder of (workspace.workspaceFolders || []).filter(workspace => workspace.uri.scheme === 'file')) {
      this.workspaces[folder.uri.fsPath] = new WorkspaceDeclarations(folder);
      this.workspaces[folder.uri.fsPath].workspaceStateChanged(state => this.workspaceChanged(state));
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
      this.logger.debug('Did not find index for file', { file: fileUri.fsPath });
      return;
    }

    return this.workspaces[workspaceFolder.uri.fsPath].index;
  }

  public dispose(): void {
    this.logger.debug('Disposing DeclarationManager.');
    for (const folder of Object.values(this.workspaces)) {
      folder.dispose();
    }
  }

  private workspaceChanged(state: WorkspaceDeclarationsState): void {
    if (this.statusBarItem.text === ResolverState.error) {
      return;
    }
    if (state === WorkspaceDeclarationsState.Error) {
      this.statusBarItem.text = ResolverState.error;
      return;
    }
    if (state === WorkspaceDeclarationsState.Syncing) {
      this.activeWorkspaces++;
      this.statusBarItem.text = ResolverState.syncing;
      return;
    }
    if (state === WorkspaceDeclarationsState.Idle) {
      this.activeWorkspaces--;
    }
    if (this.activeWorkspaces <= 0) {
      this.statusBarItem.text = ResolverState.ok;
    }
  }
}
