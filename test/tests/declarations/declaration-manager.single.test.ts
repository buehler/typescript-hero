import { join } from 'path';
import sinon = require('sinon');
import { ExtensionContext, Uri, workspace, WorkspaceFoldersChangeEvent } from 'vscode';

import DeclarationManager from '../../../src/declarations/declaration-manager';
import WorkspaceDeclarations, { WorkspaceDeclarationsState } from '../../../src/declarations/workspace-declarations';
import ioc from '../../../src/ioc';
import iocSymbols from '../../../src/ioc-symbols';
import { Logger } from '../../../src/utilities/logger';
import { expect } from '../setup';

describe('DeclarationManager (single root)', () => {

  const folder = workspace.workspaceFolders![0];
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

    expect(spy.callCount).to.equal(1);
  });

  it('should return the index for a file', async () => {
    const declarations = new WorkspaceDeclarations(folder);
    await declarations.initialize();

    (manager as any).workspaces[folder.uri.fsPath] = declarations;
    const file = Uri.file(join(folder.uri.fsPath, 'declarations', 'index.ts'));

    expect(manager.getIndexForFile(file)).to.equal(declarations.index);
  });

  it('should return undefined for a non found file', async () => {
    const file = Uri.file(join(folder.uri.fsPath, 'declarations', 'notfoundfile.ts'));

    expect(manager.getIndexForFile(file)).not.to.exist;
  });

  it('should add a new workspace on a changed event', () => {
    const stub = sinon.stub(manager as any, 'createWorkspace');
    stub.returns(Promise.resolve());

    const event = {
      added: [
        {
          index: 1,
          name: 'newWorkspace',
          uri: Uri.file(''),
        },
      ],
      removed: [],
    } as WorkspaceFoldersChangeEvent;
    (manager as any).workspaceFoldersChanged(event);
    expect(stub.callCount).to.equal(1);
  });

  it('should remove a workspace on a changed event', async () => {
    const declarations = new WorkspaceDeclarations(folder);
    await declarations.initialize();
    (manager as any).workspaces[folder.uri.fsPath] = declarations;

    const stub = sinon.stub(manager as any, 'createWorkspace');
    stub.returns(Promise.resolve());
    const spy = sinon.spy(declarations, 'dispose');

    const event = {
      added: [],
      removed: [folder],
    } as WorkspaceFoldersChangeEvent;
    (manager as any).workspaceFoldersChanged(event);
    expect(stub.callCount).to.equal(0);
    expect(spy.callCount).to.equal(1);
  });

  it('should set the state to syncing when a workspace starts syncing', () => {
    sinon.stub(manager as any, 'createWorkspace').returns(Promise.resolve());
    manager.setup();
    expect((manager as any).activeWorkspaces).to.equal(0);
    (manager as any).workspaceStateChanged(WorkspaceDeclarationsState.Syncing);
    expect((manager as any).activeWorkspaces).to.equal(1);
    expect((manager as any).statusBarItem.text).to.equal('TSH Resolver $(sync)');
  });

  it('should set the state to ok when all workspaces are finished', () => {
    sinon.stub(manager as any, 'createWorkspace').returns(Promise.resolve());
    manager.setup();
    expect((manager as any).activeWorkspaces).to.equal(0);
    (manager as any).workspaceStateChanged(WorkspaceDeclarationsState.Syncing);
    (manager as any).workspaceStateChanged(WorkspaceDeclarationsState.Syncing);
    expect((manager as any).activeWorkspaces).to.equal(2);
    expect((manager as any).statusBarItem.text).to.equal('TSH Resolver $(sync)');
    (manager as any).workspaceStateChanged(WorkspaceDeclarationsState.Idle);
    (manager as any).workspaceStateChanged(WorkspaceDeclarationsState.Idle);
    expect((manager as any).activeWorkspaces).to.equal(0);
    expect((manager as any).statusBarItem.text).to.equal('TSH Resolver $(check)');
  });

  it('should set the state to error when one workspace errors', () => {
    sinon.stub(manager as any, 'createWorkspace').returns(Promise.resolve());
    const stub = sinon.stub((manager as any).logger, 'error').returns(() => { });
    try {
      manager.setup();
      expect((manager as any).activeWorkspaces).to.equal(0);
      (manager as any).workspaceStateChanged(WorkspaceDeclarationsState.Syncing);
      expect((manager as any).activeWorkspaces).to.equal(1);
      (manager as any).workspaceStateChanged(WorkspaceDeclarationsState.Error);
      expect((manager as any).statusBarItem.text).to.equal('TSH Resolver $(flame)');
    } finally {
      stub.restore();
    }
  });

  it('should not change the state away from error on other events', () => {
    sinon.stub(manager as any, 'createWorkspace').returns(Promise.resolve());
    const stub = sinon.stub((manager as any).logger, 'error').returns(() => { });
    try {
      manager.setup();
      expect((manager as any).activeWorkspaces).to.equal(0);
      (manager as any).workspaceStateChanged(WorkspaceDeclarationsState.Syncing);
      expect((manager as any).activeWorkspaces).to.equal(1);
      (manager as any).workspaceStateChanged(WorkspaceDeclarationsState.Error);
      expect((manager as any).statusBarItem.text).to.equal('TSH Resolver $(flame)');
      (manager as any).workspaceStateChanged(WorkspaceDeclarationsState.Syncing);
      expect((manager as any).statusBarItem.text).to.equal('TSH Resolver $(flame)');
    } finally {
      stub.restore();
    }
  });

});
