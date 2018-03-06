import { join } from 'path';
import { ClassDeclaration, DeclarationInfo, DefaultDeclaration, File } from 'typescript-parser';
import { Position, Range, TextDocument, Uri, window, workspace } from 'vscode';

import { ImportAppender } from '../../../src/imports';
import ioc from '../../../src/ioc';
import iocSymbols from '../../../src/ioc-symbols';
import { expect } from '../setup';

describe('ImportAppender', () => {

  describe('import-appender-file.ts', () => {

    const rootPath = workspace.workspaceFolders![0].uri.fsPath;
    const file = Uri.file(join(rootPath, 'imports', 'import-appender-file.ts'));
    let document: TextDocument;
    let extension: { addImportToDocument(declaration: DeclarationInfo): Promise<boolean> };

    before(async () => {
      document = await workspace.openTextDocument(file);
      await window.showTextDocument(document);

      extension = new ImportAppender(
        ioc.get(iocSymbols.extensionContext),
        ioc.get(iocSymbols.logger),
        ioc.get(iocSymbols.importManager),
        ioc.get(iocSymbols.declarationManager),
        ioc.get(iocSymbols.parser),
      ) as any;
    });

    afterEach(async () => {
      await window.activeTextEditor!.edit((builder) => {
        builder.delete(new Range(
          new Position(0, 0),
          document.lineAt(document.lineCount - 1).rangeIncludingLineBreak.end,
        ));
      });
    });

    it('should add a normal named import', async () => {
      await extension.addImportToDocument({
        from: '/lib',
        declaration: new ClassDeclaration('MyClass', true, 0, 0),
      });
      expect(window.activeTextEditor!.document.getText()).to.matchSnapshot();
    });

    it('should add a double normal named import', async () => {
      await extension.addImportToDocument({
        from: '/lib',
        declaration: new ClassDeclaration('MyClass', true, 0, 0),
      });
      await extension.addImportToDocument({
        from: '/lib',
        declaration: new ClassDeclaration('MyClass2', true, 0, 0),
      });
      expect(window.activeTextEditor!.document.getText()).to.matchSnapshot();
    });

    it('should add a normal default import', async () => {
      await extension.addImportToDocument({
        from: '/lib',
        declaration: new DefaultDeclaration('defaultDec', new File(file.fsPath, rootPath, 0, 0), 0, 0),
      });
      expect(window.activeTextEditor!.document.getText()).to.matchSnapshot();
    });

    it('should add an import below a comment', async () => {
      await window.activeTextEditor!.edit((builder) => {
        builder.insert(
          new Position(0, 0),
          `// my fancy comment\n`,
        );
      });
      await extension.addImportToDocument({
        from: '/lib',
        declaration: new ClassDeclaration('MyClass', true, 0, 0),
      });
      expect(window.activeTextEditor!.document.getText()).to.matchSnapshot();
    });

    it('should add an import below a block comment', async () => {
      await window.activeTextEditor!.edit((builder) => {
        builder.insert(
          new Position(0, 0),
          `/* \n * copy right by me!\n */\n`,
        );
      });
      await extension.addImportToDocument({
        from: '/lib',
        declaration: new ClassDeclaration('MyClass', true, 0, 0),
      });
      expect(window.activeTextEditor!.document.getText()).to.matchSnapshot();
    });

    it('should add an import below a jsdoc comment', async () => {
      await window.activeTextEditor!.edit((builder) => {
        builder.insert(
          new Position(0, 0),
          `/** \n * js documentation!\n */\n`,
        );
      });
      await extension.addImportToDocument({
        from: '/lib',
        declaration: new ClassDeclaration('MyClass', true, 0, 0),
      });
      expect(window.activeTextEditor!.document.getText()).to.matchSnapshot();
    });

    it('should add an import below a shebang', async () => {
      await window.activeTextEditor!.edit((builder) => {
        builder.insert(
          new Position(0, 0),
          `#! /usr/bin/env node\n`,
        );
      });
      await extension.addImportToDocument({
        from: '/lib',
        declaration: new ClassDeclaration('MyClass', true, 0, 0),
      });
      expect(window.activeTextEditor!.document.getText()).to.matchSnapshot();
    });

    it('should add an import below a use strict', async () => {
      await window.activeTextEditor!.edit((builder) => {
        builder.insert(
          new Position(0, 0),
          `"use strict"\n`,
        );
      });
      await extension.addImportToDocument({
        from: '/lib',
        declaration: new ClassDeclaration('MyClass', true, 0, 0),
      });
      expect(window.activeTextEditor!.document.getText()).to.matchSnapshot();
    });

  });

});
