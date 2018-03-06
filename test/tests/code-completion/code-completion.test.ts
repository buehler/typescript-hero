import { join } from 'path';
import { CancellationTokenSource, Position, TextDocument, Uri, window, workspace } from 'vscode';

import { CodeCompletion } from '../../../src/code-completion';
import DeclarationManager from '../../../src/declarations/declaration-manager';
import ioc from '../../../src/ioc';
import iocSymbols from '../../../src/ioc-symbols';
import { expect, waitForIndexReady } from '../setup';

describe.only('CodeCompletion', () => {

  const rootPath = workspace.workspaceFolders![0].uri.fsPath;
  const token = new CancellationTokenSource().token;
  const file = Uri.file(join(rootPath, 'code-completion', 'completions.ts'));
  let document: TextDocument;
  let extension: CodeCompletion;

  before(async () => {
    document = await workspace.openTextDocument(file);
    await window.showTextDocument(document);

    const declarations = ioc.get<DeclarationManager>(iocSymbols.declarationManager);
    extension = new CodeCompletion(
      ioc.get(iocSymbols.extensionContext),
      ioc.get(iocSymbols.logger),
      ioc.get(iocSymbols.configuration),
      ioc.get(iocSymbols.importManager),
      declarations,
      ioc.get(iocSymbols.parser),
    );

    await waitForIndexReady(declarations.getIndexForFile(document.uri)!);
  });

  describe('provideCompletionItems()', () => {

    it('should provide a completion list', async () => {
      const result = await extension.provideCompletionItems(document, new Position(0, 17), token);
      expect(result).to.matchSnapshot();
    });

  });

});
