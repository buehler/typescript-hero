import sinon = require('sinon');
import { ExtensionContext } from 'vscode';

import DeclarationManager from '../../../src/declarations/declaration-manager';
import ioc from '../../../src/ioc';
import iocSymbols from '../../../src/ioc-symbols';
import { Logger } from '../../../src/utilities/logger';
import { expect } from '../setup';

describe.only('DeclarationManager (single root)', () => {

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

  it('should return the index for a file', () => {
    // Uri.file();
  });

  it('should return undefined for a non found file');

  it('should add a new workspace on a changed event');

  it('should remove a workspace on a changed event');

  it('should set the state to syncing when a workspace starts syncing');

  it('should set the state to ok when all workspaces are finished');

  it('should set the state to error when one workspace errors');

  it('should not change the state away from error on other events');

});
