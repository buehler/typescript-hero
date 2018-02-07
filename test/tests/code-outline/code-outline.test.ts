import { join } from 'path';
import { TypescriptParser } from 'typescript-parser';
import { commands, ExtensionContext, workspace } from 'vscode';

import CodeOutline from '../../../src/code-outline';
import Configuration from '../../../src/configuration';
import ioc from '../../../src/ioc';
import iocSymbols from '../../../src/ioc-symbols';
import { Logger } from '../../../src/utilities/logger';
import { expect } from '../setup';

describe('CodeOutline', () => {

  let context: ExtensionContext;
  let logger: Logger;
  let config: Configuration;
  let parser: TypescriptParser;
  let extension: CodeOutline;

  before(() => {
    context = ioc.get<ExtensionContext>(iocSymbols.extensionContext);
    logger = ioc.get<Logger>(iocSymbols.logger);
    config = ioc.get<Configuration>(iocSymbols.configuration);
    parser = ioc.get<TypescriptParser>(iocSymbols.parser);

    extension = new CodeOutline(context, logger, config, parser);
  });

  const rootPath = workspace.workspaceFolders![0].uri.fsPath;
  const files = {
    empty: join(rootPath, 'code-outline', 'empty.ts'),
    nonParseable: join(rootPath, 'code-outline', 'not-parseable.txt'),
    code: join(rootPath, 'code-outline', 'code.ts'),
  };

  it('should return an empty array if no document is open', async () => {
    await commands.executeCommand('workbench.action.closeAllEditors');
    console.log(files);
    expect(extension.getChildren()).to.matchSnapshot();
  });

});
