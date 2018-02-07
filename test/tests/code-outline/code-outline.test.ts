import { join } from 'path';
import { TypescriptParser } from 'typescript-parser';
import { commands, ExtensionContext, window, workspace } from 'vscode';

import CodeOutline from '../../../src/code-outline';
import Configuration from '../../../src/configuration';
import ioc from '../../../src/ioc';
import iocSymbols from '../../../src/ioc-symbols';
import { Logger } from '../../../src/utilities/logger';
import { expect } from '../setup';

describe('CodeOutline', () => {
  const rootPath = workspace.workspaceFolders![0].uri.fsPath;
  const files = {
    empty: join(rootPath, 'code-outline', 'empty.ts'),
    nonParseable: join(rootPath, 'code-outline', 'not-parseable.txt'),
    codeTs: join(rootPath, 'code-outline', 'code.ts'),
    codeJs: join(rootPath, 'code-outline', 'code.js'),
  };

  let extension: CodeOutline;

  before(async () => {
    const document = await workspace.openTextDocument(files.empty);
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

  it('should return an empty array if no document is open', async () => {
    await commands.executeCommand('workbench.action.closeAllEditors');
    expect(await extension.getChildren()).to.matchSnapshot();
  });

  it('should return disabled structure item when it is disabled', async () => {
    const document = await workspace.openTextDocument(files.codeTs);
    await window.showTextDocument(document);
    const config = workspace.getConfiguration('typescriptHero');
    const value = config.get('codeOutline.enabled', true);

    try {
      await config.update('codeOutline.enabled', false);
      expect(
        (await extension.getChildren() || []).map(c => ({ label: c.label, ctor: c.constructor.name })),
      ).to.matchSnapshot();
    } finally {
      await config.update('codeOutline.enabled', value);
    }
  });

  it('should return not parseable on non ts / js file', async () => {
    const document = await workspace.openTextDocument(files.nonParseable);
    await window.showTextDocument(document);

    expect(
      (await extension.getChildren() || []).map(c => ({ label: c.label, ctor: c.constructor.name })),
    ).to.matchSnapshot();
  });

  it('should return a code structure for a valid ts file', async () => {
    const document = await workspace.openTextDocument(files.codeTs);
    await window.showTextDocument(document);
    (extension as any).documentCache = undefined;
    expect(
      (await extension.getChildren() || []).map(c => ({ label: c.label, ctor: c.constructor.name })),
    ).to.matchSnapshot();
  });

  it('should return a code structure for a valid js file', async () => {
    const document = await workspace.openTextDocument(files.codeJs);
    await window.showTextDocument(document);
    (extension as any).documentCache = undefined;
    expect(
      (await extension.getChildren() || []).map(c => ({ label: c.label, ctor: c.constructor.name })),
    ).to.matchSnapshot();
  });

});
