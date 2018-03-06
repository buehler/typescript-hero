import { join } from 'path';
import { stub } from 'sinon';
import { CancellationTokenSource, Position, TextDocument, Uri, window, workspace } from 'vscode';

import { CodeCompletion } from '../../../src/code-completion';
import Configuration from '../../../src/configuration';
import DeclarationManager from '../../../src/declarations/declaration-manager';
import ioc from '../../../src/ioc';
import iocSymbols from '../../../src/ioc-symbols';
import { expect, waitForIndexReady } from '../setup';

describe('CodeCompletion', () => {

  const rootPath = workspace.workspaceFolders![0].uri.fsPath;
  const token = new CancellationTokenSource().token;
  const file = Uri.file(join(rootPath, 'code-completion', 'completions.ts'));
  let document: TextDocument;
  let extension: CodeCompletion;
  let declarations: DeclarationManager;
  let config: Configuration;

  before(async () => {
    document = await workspace.openTextDocument(file);
    await window.showTextDocument(document);

    declarations = ioc.get<DeclarationManager>(iocSymbols.declarationManager);
    config = ioc.get<Configuration>(iocSymbols.configuration);
    extension = new CodeCompletion(
      ioc.get(iocSymbols.extensionContext),
      ioc.get(iocSymbols.logger),
      config,
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

    it('should provide a completion list for interfaces', async () => {
      const result = await extension.provideCompletionItems(document, new Position(1, 17), token);
      expect(result).to.matchSnapshot();
    });

    it('should provide a completion list for default imports', async () => {
      const result = await extension.provideCompletionItems(document, new Position(2, 6), token);
      expect(result).to.matchSnapshot();
    });

    it('should not provide a completion list for non ready indices', async () => {
      const mock = stub(declarations, 'getIndexForFile').callsFake(() => ({ indexReady: false }));
      try {
        const result = await extension.provideCompletionItems(document, new Position(0, 0), token);
        expect(result).to.be.null;
      } finally {
        mock.restore();
      }
    });

    it('should not provide a completion list for undefined workspaces', async () => {
      const mock = stub(workspace, 'getWorkspaceFolder').callsFake(() => undefined);
      try {
        const result = await extension.provideCompletionItems(document, new Position(0, 0), token);
        expect(result).to.be.null;
      } finally {
        mock.restore();
      }
    });

    it('should not provide a completion list for undefined indices', async () => {
      const mock = stub(declarations, 'getIndexForFile').callsFake(() => undefined);
      try {
        const result = await extension.provideCompletionItems(document, new Position(0, 0), token);
        expect(result).to.be.null;
      } finally {
        mock.restore();
      }
    });

    it('should not provide a completion list for typing in a string', async () => {
      const result = await extension.provideCompletionItems(document, new Position(3, 18), token);
      expect(result).to.be.null;
    });

    it('should not provide a completion list for typing after a "."', async () => {
      const result = await extension.provideCompletionItems(document, new Position(4, 24), token);
      expect(result).to.be.null;
    });

    it('should not provide a completion list for typing in a comment', async () => {
      const result = await extension.provideCompletionItems(document, new Position(5, 20), token);
      expect(result).to.be.null;
    });

    it('should not provide a completion list for typing in an import', async () => {
      const result = await extension.provideCompletionItems(document, new Position(6, 24), token);
      expect(result).to.be.null;
    });

    it('should not provide a completion for the own file', async () => {
      const result = await extension.provideCompletionItems(document, new Position(9, 5), token);
      expect(result).to.matchSnapshot();
    });

    it('should provide a completion list bottom sorted', async () => {
      const mock = stub(config.codeCompletion, 'completionSortMode').callsFake(() => 'bottom');
      try {
        const result = await extension.provideCompletionItems(document, new Position(0, 17), token);
        expect(result).to.matchSnapshot();
      } finally {
        mock.restore();
      }
    });

  });

});
