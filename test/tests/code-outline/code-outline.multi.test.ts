import { join } from 'path';
import { TypescriptParser } from 'typescript-parser';
import { commands, ExtensionContext, window, workspace } from 'vscode';

import CodeOutline from '../../../src/code-outline';
import Configuration from '../../../src/configuration';
import ioc from '../../../src/ioc';
import iocSymbols from '../../../src/ioc-symbols';
import { Logger } from '../../../src/utilities/logger';
import { expect } from '../setup';

describe('CodeOutline (multi root)', () => {
  const r1 = workspace.workspaceFolders![0].uri.fsPath;
  const r2 = workspace.workspaceFolders![1].uri.fsPath;

  const files = {
    W1_codeTs: join(r1, 'code-outline', 'code.ts'),
    W2_codeTs: join(r2, 'code-outline', 'code.ts'),
  };

  let extension: CodeOutline;

  before(async () => {
    const document = await workspace.openTextDocument(files.W1_codeTs);
    await window.showTextDocument(document);

    const context = ioc.get<ExtensionContext>(iocSymbols.extensionContext);
    const logger = ioc.get<Logger>(iocSymbols.logger);
    const config = ioc.get<Configuration>(iocSymbols.configuration);
    const parser = ioc.get<TypescriptParser>(iocSymbols.parser);

    extension = new CodeOutline(context, logger, config, parser);
  });

  after(async () => {
    await commands.executeCommand('workbench.action.closeAllEditors');
  });

  it('should return a code structure for a valid ts file (workspace 1)', async () => {
    const document = await workspace.openTextDocument(files.W1_codeTs);
    await window.showTextDocument(document);
    (extension as any).documentCache = undefined;
    expect(
      (await extension.getChildren() || []).map(c => ({ label: c.label, ctor: c.constructor.name })),
    ).to.matchSnapshot();
  });

  it('should return a code structure for a valid js file (workspace 2)', async () => {
    const document = await workspace.openTextDocument(files.W2_codeTs);
    await window.showTextDocument(document);
    (extension as any).documentCache = undefined;
    expect(
      (await extension.getChildren() || []).map(c => ({ label: c.label, ctor: c.constructor.name })),
    ).to.matchSnapshot();
  });

});
