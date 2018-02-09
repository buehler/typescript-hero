import { parse, sep } from 'path';
import * as sinon from 'sinon';
import { DefaultDeclaration, File } from 'typescript-parser';
import { workspace } from 'vscode';

import WorkspaceDeclarations, { WorkspaceDeclarationsState } from '../../../src/declarations/workspace-declarations';
import { expect, wait } from '../setup';

describe('WorkspaceDeclarations', () => {

  const folder = workspace.workspaceFolders![0];
  let workspaceDeclarations: WorkspaceDeclarations;

  beforeEach(() => {
    workspaceDeclarations = new WorkspaceDeclarations(folder);
  });

  afterEach(() => {
    if (workspaceDeclarations) {
      workspaceDeclarations.dispose();
    }
  });

  it('should create an object', () => {
    expect(new WorkspaceDeclarations(folder)).to.exist;
  });

  it('should return the correct files', async () => {
    const files = await (workspaceDeclarations as any).findFiles() as string[];
    const declarationFiles = files
      .filter(file => file.indexOf(`workspace_1${sep}declarations`) >= 0)
      .map(file => parse(file).base);

    expect(declarationFiles).to.matchSnapshot();
  });

  it('should not add non ts files', async () => {
    const files = await (workspaceDeclarations as any).findFiles() as string[];
    const declarationFiles = files
      .filter(file => file.indexOf(`workspace_1${sep}declarations`) >= 0)
      .map(file => parse(file).ext);

    for (const ext of declarationFiles) {
      expect(ext).to.equal('.ts');
    }
  });

  it('should initialize an index', async () => {
    expect(workspaceDeclarations.index).not.to.exist;
    await workspaceDeclarations.initialize();
    expect(workspaceDeclarations.index).to.exist;
    expect(workspaceDeclarations.index.indexReady).to.equal(true);
  });

  it('should call syncing event', async () => {
    const spy = sinon.spy();
    workspaceDeclarations.workspaceStateChanged(spy);
    await workspaceDeclarations.initialize();
    expect(spy.getCall(0).args[0]).to.equal(WorkspaceDeclarationsState.Syncing);
  });

  it('should call idle event on finished sync', async () => {
    const spy = sinon.spy();
    workspaceDeclarations.workspaceStateChanged(spy);
    await workspaceDeclarations.initialize();
    expect(spy.getCall(1).args[0]).to.equal(WorkspaceDeclarationsState.Idle);
  });

  it('should call reindex when a file has changed', async () => {
    await workspaceDeclarations.initialize();
    const eventSpy = sinon.spy();
    const reindexSpy = sinon.stub(workspaceDeclarations.index, 'reindexForChanges');
    reindexSpy.returns(Promise.resolve());
    workspaceDeclarations.workspaceStateChanged(eventSpy);

    expect(eventSpy.callCount).to.equal(0);
    (workspaceDeclarations as any).fileWatcherEvent(
      'updated',
      { fsPath: './file-to-index.ts' },
    );
    await wait(550);
    expect(eventSpy.callCount).to.equal(2);
    expect(reindexSpy.getCall(0).args).to.matchSnapshot();
  });

  it('should return the correct declarations for a workspace', async () => {
    await workspaceDeclarations.initialize();

    const declarations = workspaceDeclarations.index.declarationInfos.filter(d => d.from.startsWith('/declarations'));
    for (const d of declarations) {
      if (d.declaration instanceof DefaultDeclaration) {
        delete ((d.declaration as any).resource as File).filePath;
        delete (d.declaration as any).resource.rootPath;
      }
    }
    expect(declarations).to.matchSnapshot();
  });

  it('should return the correct declarations for a file', async () => {
    await workspaceDeclarations.initialize();

    const declarations = workspaceDeclarations
      .index
      .declarationInfos
      .filter(d => d.from.startsWith('/declarations/multi-declarations'));

    expect(declarations).to.matchSnapshot();
  });

  it('should correctly move declarations for a barrel file', async () => {
    await workspaceDeclarations.initialize();

    const declarations1 = workspaceDeclarations
      .index
      .declarationInfos
      .filter(d => d.from.startsWith('/declarations/declarations-for-barrel-1'));
    const declarations2 = workspaceDeclarations
      .index
      .declarationInfos
      .filter(d => d.from.startsWith('/declarations/declarations-for-barrel-2'));
    const barrel = workspaceDeclarations
      .index
      .declarationInfos
      .filter(d => d.from.startsWith('/declarations/barrel'));

    expect(declarations1).to.matchSnapshot();
    expect(declarations2).to.matchSnapshot();
    expect(barrel).to.matchSnapshot();
  });

  it('should correctly remove trailing /index from location', async () => {
    await workspaceDeclarations.initialize();

    expect(
      workspaceDeclarations.index.declarationInfos
        .filter(d => d.from.startsWith('/declarations'))
        .map(d => d.from)
        .every(from => from.indexOf('/index') === -1),
    ).to.equal(true);
  });

  it('should correctly ignore workspace files that are ignored by config');

  it('should correctly add workspace files that are not ignored by config anymore');

});
