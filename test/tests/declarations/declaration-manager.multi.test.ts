import { join } from 'path';
import sinon = require('sinon');
import { ExtensionContext, Uri, workspace } from 'vscode';

import DeclarationManager from '../../../src/declarations/declaration-manager';
import WorkspaceDeclarations from '../../../src/declarations/workspace-declarations';
import ioc from '../../../src/ioc';
import iocSymbols from '../../../src/ioc-symbols';
import { Logger } from '../../../src/utilities/logger';
import { expect } from '../setup';

describe('DeclarationManager (multi root)', () => {

  const folders = {
    1: workspace.workspaceFolders![0],
    2: workspace.workspaceFolders![1],
    3: workspace.workspaceFolders![2],
  };
  let context: ExtensionContext;
  let manager: DeclarationManager;

  beforeEach(() => {
    const logger = ioc.get<Logger>(iocSymbols.logger);
    context = {
      subscriptions: [],
    } as any as ExtensionContext;
    manager = new DeclarationManager(context, logger);
  });

  afterEach(() => {
    manager.dispose();
    for (const disposable of context.subscriptions) {
      disposable.dispose();
    }
  });

  it('should create a status bar item', () => {
    expect((manager as any).statusBarItem).not.to.exist;
    manager.setup();
    expect((manager as any).statusBarItem).to.exist;
  });

  it('should create a workspace for each workspace folder', () => {
    const spy = sinon.spy(manager as any, 'createWorkspace');
    manager.setup();

    expect(spy.callCount).to.equal(3);
  });

  it('should return the index for a file', async () => {
    const d1 = new WorkspaceDeclarations(folders['1']);
    const d2 = new WorkspaceDeclarations(folders['2']);
    await d1.initialize();
    await d2.initialize();

    (manager as any).workspaces[folders['1'].uri.fsPath] = d1;
    (manager as any).workspaces[folders['2'].uri.fsPath] = d2;
    const f1 = Uri.file(join(folders['1'].uri.fsPath, 'declarations', 'index.ts'));
    const f2 = Uri.file(join(folders['2'].uri.fsPath, 'declarations', 'declarations.ts'));

    expect(manager.getIndexForFile(f1)).to.equal(d1.index);
    expect(manager.getIndexForFile(f2)).to.equal(d2.index);
  });

  it('should return undefined for a non found file', async () => {
    const file = Uri.file(join(folders['1'].uri.fsPath, 'declarations', 'notfoundfile.ts'));

    expect(manager.getIndexForFile(file)).not.to.exist;
  });

});
