import { join } from 'path';
import { ClassDeclaration, DefaultDeclaration, File, ModuleDeclaration } from 'typescript-parser';
import { Position, Range, TextDocument, Uri, window, workspace } from 'vscode';

import ImportManager from '../../../src/imports/import-manager';
import ioc from '../../../src/ioc';
import iocSymbols, { ImportManagerProvider } from '../../../src/ioc-symbols';
import { expect, getDocumentText } from '../setup';

describe('ImportManager', () => {

  describe('Typescript', () => {

    const rootPath = workspace.workspaceFolders![0].uri.fsPath;
    const file = Uri.file(join(rootPath, 'imports', 'import-manager-file.ts'));
    const provider: ImportManagerProvider = ioc.get<ImportManagerProvider>(iocSymbols.importManager);
    let document: TextDocument;
    let documentText: string;

    before(async () => {
      document = await workspace.openTextDocument(file);
      await window.showTextDocument(document);

      documentText = document.getText();
    });

    afterEach(async () => {
      await window.activeTextEditor!.edit((builder) => {
        builder.delete(new Range(
          new Position(0, 0),
          document.lineAt(document.lineCount - 1).rangeIncludingLineBreak.end,
        ));
        builder.insert(new Position(0, 0), documentText);
      });

    });

    describe('Constructor (via provider)', () => {

      it('should create a document controller', async () => {
        const ctrl = await provider(document);

        expect(ctrl).to.be.an.instanceof(ImportManager);
      });

      it('should parse the document', async () => {
        const ctrl = await provider(document);

        expect((ctrl as any).parsedDocument).to.be.an.instanceof(File);
      });

      it('should add an import proxy for a named import', async () => {
        const ctrl = await provider(document);
        const imps = (ctrl as any).parsedDocument.imports;

        expect(imps).to.matchSnapshot();
      });

      it('should add an import proxy for a default import', async () => {
        await window.activeTextEditor!.edit((builder) => {
          builder.replace(
            new Range(
              new Position(0, 0),
              new Position(1, 0),
            ),
            `import myDefaultExportedFunction from '../defaultExport/lateDefaultExportedElement';\n`,
          );
        });

        const ctrl = await provider(document);
        const imps = (ctrl as any).parsedDocument.imports;

        expect(imps).to.matchSnapshot();
      });

      it('should add multiple import proxies', async () => {
        await window.activeTextEditor!.edit((builder) => {
          builder.insert(
            new Position(0, 0),
            `import myDefaultExportedFunction from '../defaultExport/lateDefaultExportedElement';\n`,
          );
        });

        const ctrl = await provider(document);
        const imps = (ctrl as any).parsedDocument.imports;

        expect(imps).to.matchSnapshot();
      });

      it('should not add a proxy for a namespace import', async () => {
        await window.activeTextEditor!.edit((builder) => {
          builder.replace(
            new Range(
              new Position(0, 0),
              new Position(1, 0),
            ),
            `import * as bodyParser from 'body-parser';\n`,
          );
        });

        const ctrl = await provider(document);
        const imps = (ctrl as any).parsedDocument.imports;

        expect(imps).to.matchSnapshot();
      });

      it('should not add a proxy for an external import', async () => {
        await window.activeTextEditor!.edit((builder) => {
          builder.replace(
            new Range(
              new Position(0, 0),
              new Position(1, 0),
            ),
            `import bodyParser = require('body-parser');\n`,
          );
        });

        const ctrl = await provider(document);
        const imps = (ctrl as any).parsedDocument.imports;

        expect(imps).to.matchSnapshot();
      });

      it('should not add a proxy for a string import', async () => {
        await window.activeTextEditor!.edit((builder) => {
          builder.replace(
            new Range(
              new Position(0, 0),
              new Position(1, 0),
            ),
            `import 'body-parser';\n`,
          );
        });

        const ctrl = await provider(document);
        const imps = (ctrl as any).parsedDocument.imports;

        expect(imps).to.matchSnapshot();
      });

    });

    describe('addDeclarationImport()', () => {

      it('should add a normal import to the document', async () => {
        const ctrl = await provider(document);
        const declaration = new ClassDeclaration('classdeclaration', true);
        ctrl.addDeclarationImport({ declaration, from: '../lib' });

        expect((ctrl as any).imports).to.matchSnapshot();
      });

      it('should add a module import to the import index', async () => {
        const ctrl = await provider(document);
        const declaration = new ModuleDeclaration('module');
        ctrl.addDeclarationImport({ declaration, from: 'my-module' });

        expect((ctrl as any).imports).to.matchSnapshot();
      });

      it('should add a default import to the import index.', async () => {
        const ctrl = await provider(document);

        const declaration = new DefaultDeclaration('defaultdeclaration', new File('path', rootPath, 0, 1));
        ctrl.addDeclarationImport({ declaration, from: '../lib' });

        expect((ctrl as any).imports).to.matchSnapshot();
      });

      it('should add multiple imports to the import index', async () => {
        const ctrl = await provider(document);
        const declarations = [
          new ClassDeclaration('class1', true),
          new ClassDeclaration('class2', true),
        ];
        ctrl
          .addDeclarationImport({ declaration: declarations[0], from: '../lib1' })
          .addDeclarationImport({ declaration: declarations[1], from: '../lib2' });

        expect((ctrl as any).imports).to.matchSnapshot();
      });

      it('should add an import to an existing import index item', async () => {
        const ctrl = await provider(document);
        const declarations = [
          new ClassDeclaration('class1', true),
          new ClassDeclaration('class2', true),
        ];

        ctrl
          .addDeclarationImport({ declaration: declarations[0], from: '../lib1' })
          .addDeclarationImport({ declaration: declarations[1], from: '../lib1' });

        expect((ctrl as any).imports).to.matchSnapshot();
      });

      it('should not add the same specifier twice', async () => {
        const ctrl = await provider(document);
        const declaration = new ClassDeclaration('class', true);

        ctrl.addDeclarationImport({ declaration, from: '../lib' });

        expect((ctrl as any).imports).to.matchSnapshot();

        ctrl.addDeclarationImport({ declaration, from: '../lib' });

        expect((ctrl as any).imports).to.matchSnapshot();
      });

      it('should add a normal import to a group', async () => {
        const ctrl = await provider(document);
        const declaration = new ClassDeclaration('class', true);

        expect((ctrl as any).importGroups[2]).to.matchSnapshot();

        ctrl.addDeclarationImport({ declaration, from: '../lib' });

        expect((ctrl as any).importGroups[2]).to.matchSnapshot();
      });

      it('should add an import to an existing import group', async () => {
        const ctrl = await provider(document);
        const declaration = new ClassDeclaration('class', true);
        const declaration2 = new ClassDeclaration('class2', true);

        expect((ctrl as any).importGroups[2]).to.matchSnapshot();

        ctrl
          .addDeclarationImport({ declaration, from: '../lib1' })
          .addDeclarationImport({ declaration: declaration2, from: '../lib1' });

        expect((ctrl as any).importGroups[2]).to.matchSnapshot();
      });

    });

    describe('organizeImports()', () => {

      it('should remove an unused import');

      it('should remove an unused specifier');

      it('should not remove an excluded library');

      it('should merge two same libraries into one import');

    });

    describe('commit()', () => {

      it('should not touch anything if nothing changed', async () => {
        const ctrl = await provider(document);

        await window.activeTextEditor!.edit((builder) => {
          builder.replace(
            document.lineAt(0).rangeIncludingLineBreak,
            `import {Class1} from '../resourceIndex';`,
          );
        });

        expect(await ctrl.commit()).to.be.true;
        expect(document.lineAt(0).text).to.equal(`import {Class1} from '../resourceIndex';`);
      });

      it('should add a single new import to the document top', async () => {
        const ctrl = await provider(document);
        const declaration = new ClassDeclaration('importedclass', true);
        ctrl.addDeclarationImport({ declaration, from: '../imp' });
        await ctrl.commit();

        expect(document.lineAt(0).text).to.matchSnapshot();
      });

      it('should add two new imports to the document top', async () => {
        const ctrl = await provider(document);
        const declaration = new ClassDeclaration('newClass', true);
        const declaration2 = new ClassDeclaration('secondnewClass', true);

        ctrl
          .addDeclarationImport({ declaration, from: '../lib' })
          .addDeclarationImport({ declaration: declaration2, from: '../not-same-lib' });
        await ctrl.commit();

        expect(getDocumentText(document, 0, 1)).to.matchSnapshot();
      });

      it('should add three new imports to the document top', async () => {
        const ctrl = await provider(document);
        const declaration = new ClassDeclaration('newClass', true);
        const declaration2 = new ClassDeclaration('secondnewClass', true);
        const declaration3 = new ClassDeclaration('thirdnewClass', true);

        ctrl
          .addDeclarationImport({ declaration, from: '../lib' })
          .addDeclarationImport({ declaration: declaration2, from: '../not-same-lib' })
          .addDeclarationImport({ declaration: declaration3, from: '../not-same-lib-again' });
        await ctrl.commit();

        expect(getDocumentText(document, 0, 2)).to.matchSnapshot();
      });

      it('should add a single new module import to the document top', async () => {
        const ctrl = await provider(document);
        const declaration = new ModuleDeclaration('newModule');
        ctrl.addDeclarationImport({ declaration, from: 'new-module' });
        await ctrl.commit();

        expect(document.lineAt(0).text).to.matchSnapshot();
      });

      it('should add a single default import to the document top', async () => {
        const ctrl = await provider(document);
        const declaration = new DefaultDeclaration('defaultDeclaration', new File('file', rootPath, 1, 2));
        ctrl.addDeclarationImport({ declaration, from: '../lib' });
        await ctrl.commit();

        expect(document.lineAt(0).text).to.matchSnapshot();
      });

      it('should add a specifier to an existing import', async () => {
        const ctrl = await provider(document);
        const declaration = new ClassDeclaration('class2', true);
        ctrl.addDeclarationImport({ declaration, from: '/server/indices' });
        await ctrl.commit();

        expect(document.lineAt(0).text).to.matchSnapshot();
      });

      it('should add multiple specifier to an existing import', async () => {
        const ctrl = await provider(document);
        const declaration = new ClassDeclaration('class2', true);
        const declaration2 = new ClassDeclaration('class3', true);

        await ctrl
          .addDeclarationImport({ declaration, from: '/server/indices' })
          .addDeclarationImport({ declaration: declaration2, from: '/server/indices' })
          .commit();

        expect(document.lineAt(0).text).to.matchSnapshot();
      });

      it('should add a specifier with a default (first) and a normal (second) import to the doc', async () => {
        const ctrl = await provider(document);
        const def = new DefaultDeclaration('defaultExport', new File(file.fsPath, rootPath, 1, 2));
        const dec = new ClassDeclaration('defaultClass', true);

        await ctrl
          .addDeclarationImport({ declaration: def, from: '/lib' })
          .addDeclarationImport({ declaration: dec, from: '/lib' })
          .commit();

        expect(document.lineAt(0).text).to.matchSnapshot();
      });

      it('should add a specifier to an import and a new import', async () => {
        const ctrl = await provider(document);
        const declaration1 = new ClassDeclaration('class2', true);
        const declaration2 = new ClassDeclaration('class3', true);

        await ctrl
          .addDeclarationImport({ declaration: declaration1, from: '/server/indices' })
          .addDeclarationImport({ declaration: declaration2, from: '/server/not-indices' })
          .commit();

        expect(getDocumentText(document, 0, 1)).to.matchSnapshot();
      });

      it('should convert a default import when a normal specifier is added', async () => {
        const ctrl = await provider(document);
        const def = new DefaultDeclaration('defaultExport', new File(file.fsPath, rootPath, 1, 2));
        const dec = new ClassDeclaration('defaultClass', true);

        await ctrl.addDeclarationImport({ declaration: def, from: '/server/indices' }).commit();

        expect(document.lineAt(0).text).to.matchSnapshot();

        await ctrl.addDeclarationImport({ declaration: dec, from: '/server/indices' }).commit();

        expect(document.lineAt(0).text).to.matchSnapshot();
      });

      it('should convert a normal import when a default specifier is added', async () => {
        const ctrl = await provider(document);
        const def = new DefaultDeclaration('defaultExport', new File(file.fsPath, rootPath, 1, 2));
        const dec = new ClassDeclaration('defaultClass', true);

        await ctrl.addDeclarationImport({ declaration: dec, from: '/server/indices' }).commit();

        expect(document.lineAt(0).text).to.matchSnapshot();

        await ctrl.addDeclarationImport({ declaration: def, from: '/server/indices' }).commit();

        expect(document.lineAt(0).text).to.matchSnapshot();
      });

      it('should render the optimized import', async () => {
        await window.activeTextEditor!.edit((builder) => {
          builder.insert(new Position(5, 0), 'const foobar = new Class2();\n');
        });

        const ctrl = await provider(document);
        const declaration1 = new ClassDeclaration('Class2', true);
        const declaration2 = new ClassDeclaration('SomeOtherClass', true);

        await ctrl
          .addDeclarationImport({ declaration: declaration1, from: '/server/indices' })
          .addDeclarationImport({ declaration: declaration2, from: '/server/not-indices' })
          .commit();

        expect(getDocumentText(document, 0, 1)).to.matchSnapshot();

        await ctrl.organizeImports().commit();

        expect(getDocumentText(document, 0, 1)).to.matchSnapshot();
      });

      it('should render sorted imports when optimizing', async () => {
        await window.activeTextEditor!.edit((builder) => {
          builder.insert(
            new Position(0, 0),
            `import { MultiExportClass } from '../server/indices/defaultExport/multiExport';\n`,
          );
          builder.insert(new Position(5, 0), 'const foobar = new MultiExportClass();\n');
        });
        const ctrl = await provider(document);

        await ctrl.organizeImports().commit();

        expect(getDocumentText(document, 0, 1)).to.matchSnapshot();
      });

      it('should render sorted specifiers when optimizing', async () => {
        await window.activeTextEditor!.edit((builder) => {
          builder.insert(new Position(0, 9), 'Class2, ');
          builder.insert(new Position(5, 0), 'const foobar = new Class2();\n');
        });
        const ctrl = await provider(document);

        await ctrl.organizeImports().commit();

        expect(document.lineAt(0).text).to.matchSnapshot();
      });

    });

  });

});
