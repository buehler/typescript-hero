import { parse, sep } from 'path';
import { workspace } from 'vscode';

import WorkspaceDeclarations from '../../../src/declarations/workspace-declarations';
import { expect } from '../setup';

describe('WorkspaceDeclarations (multi root)', () => {

  const folder2 = workspace.workspaceFolders![1];
  const folder3 = workspace.workspaceFolders![2];

  it('should create declarations for different workspaces', async () => {
    const w1 = new WorkspaceDeclarations(folder2);
    const w2 = new WorkspaceDeclarations(folder3);

    await w1.initialize();
    await w2.initialize();

    const d1 = w1.index.declarationInfos.filter(d => d.from.startsWith('/declarations'));
    const d2 = w2.index.declarationInfos.filter(d => d.from.startsWith('/declarations'));

    expect(d1).to.matchSnapshot();
    expect(d2).to.matchSnapshot();
  });

  it('should return the correct files for different workspaces', async () => {
    const w1 = new WorkspaceDeclarations(folder2);
    const w2 = new WorkspaceDeclarations(folder3);

    const f1 = await (w1 as any).findFiles() as string[];
    const f2 = await (w2 as any).findFiles() as string[];

    const d1 = f1
      .filter(file => file.indexOf(`workspace_2${sep}declarations`) >= 0)
      .map(file => parse(file).base)
      .sort();
    const d2 = f2
      .filter(file => file.indexOf(`workspace_3${sep}declarations`) >= 0)
      .map(file => parse(file).base)
      .sort();

    expect(d1).to.matchSnapshot();
    expect(d2).to.matchSnapshot();
  });

  it('should index correct types from node_modules', async () => {
    const workspaceDeclarations = new WorkspaceDeclarations(folder3);
    await workspaceDeclarations.initialize();

    const declarations = workspaceDeclarations.index.declarationInfos
      .filter(d => d.from === 'node-module')
      .map(d => d.from);

    expect(declarations).to.matchSnapshot();
  });

  it('should index correct types from @types', async () => {
    const workspaceDeclarations = new WorkspaceDeclarations(folder3);
    await workspaceDeclarations.initialize();

    const declarations = workspaceDeclarations.index.declarationInfos
      .filter(d => d.from === 'MyModuleFromTypes');

    expect(declarations).to.matchSnapshot();
  });

});
