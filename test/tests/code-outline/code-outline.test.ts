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
    code: join(rootPath, 'code-outline', 'code.ts'),
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

});
