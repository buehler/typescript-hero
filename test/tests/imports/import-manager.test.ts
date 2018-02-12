import { join } from 'path';
import { DeclarationIndex, File, ModuleDeclaration } from 'typescript-parser';
import { Position, Range, TextDocument, Uri, window, workspace } from 'vscode';

import WorkspaceDeclarations from '../../../src/declarations/workspace-declarations';
import ImportManager from '../../../src/imports/import-manager';
import ioc from '../../../src/ioc';
import iocSymbols, { ImportManagerProvider } from '../../../src/ioc-symbols';
import { expect } from '../setup';

describe.only('ImportManager', () => {

  describe('Typescript', () => {

    const rootPath = workspace.workspaceFolders![0].uri.fsPath;
    const file = Uri.file(join(rootPath, 'imports', 'import-manager-file.ts'));
    const workspaceDeclarations = new WorkspaceDeclarations(workspace.workspaceFolders![0]);
    const provider: ImportManagerProvider = ioc.get<ImportManagerProvider>(iocSymbols.importManager);
    let document: TextDocument;
    let documentText: string;

    before(async () => {
      await workspaceDeclarations.initialize();

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
        const declaration = workspaceDeclarations.index.declarationInfos.find(o => o.declaration.name === 'Class');
        ctrl.addDeclarationImport(declaration!);

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
        const declaration = workspaceDeclarations.index.declarationInfos.find(
          o => o.declaration.name === 'DefaultMultiExport',
        );
        ctrl.addDeclarationImport(declaration!);

        expect((ctrl as any).imports).to.matchSnapshot();
      });

      it('should add multiple imports to the import index', async () => {
        const ctrl = await provider(document);
        const declarations = workspaceDeclarations.index.declarationInfos.filter(
          o => o.declaration.name.startsWith('ClassForBarrel'),
        );
        ctrl.addDeclarationImport(declarations[0]).addDeclarationImport(declarations[1]);

        expect((ctrl as any).imports).to.matchSnapshot();
      });

      it('should add an import to an existing import index item', async () => {
        const ctrl = await provider(document);
        const declaration = workspaceDeclarations.index.declarationInfos
          .find(o => o.declaration.name === 'ClassForBarrel1');
        const declaration2 = workspaceDeclarations.index.declarationInfos
          .find(o => o.declaration.name === 'ClassForBarrel2');

        ctrl.addDeclarationImport(declaration!).addDeclarationImport(declaration2!);

        expect((ctrl as any).imports).to.matchSnapshot();
      });

      it('should not add the same specifier twice', async () => {
        const ctrl = await provider(document);
        const declaration = workspaceDeclarations.index.declarationInfos.find(o => o.declaration.name === 'Class');

        ctrl.addDeclarationImport(declaration!);

        expect((ctrl as any).imports).to.matchSnapshot();

        ctrl.addDeclarationImport(declaration!);

        expect((ctrl as any).imports).to.matchSnapshot();
      });

      it('should add a normal import to a group', async () => {
        const ctrl = await provider(document);
        const declaration = workspaceDeclarations.index.declarationInfos.find(o => o.declaration.name === 'Class');

        expect((ctrl as any).importGroups[2]).to.matchSnapshot();

        ctrl.addDeclarationImport(declaration!);

        expect((ctrl as any).importGroups[2]).to.matchSnapshot();
      });

      it('should add an import to an existing import group', async () => {
        const ctrl = await provider(document);
        const declaration = workspaceDeclarations.index.declarationInfos
          .find(o => o.declaration.name === 'ClassForBarrel1');
        const declaration2 = workspaceDeclarations.index.declarationInfos
          .find(o => o.declaration.name === 'ClassForBarrel2');

        expect((ctrl as any).importGroups[2]).to.matchSnapshot();

        ctrl.addDeclarationImport(declaration!).addDeclarationImport(declaration2!);

        expect((ctrl as any).importGroups[2]).to.matchSnapshot();
      });

    });

    describe('organizeImports()', () => {

      it('should remove an unused import');

      it('should remove an unused specifier');

      it('should not remove an excluded library');

      it('should merge two same libraries into one import');

    });

    describe.skip('commit()', () => {

      it('should not touch anything if nothing changed', async () => {
        const ctrl = await ImportManager.create(document);

        await window.activeTextEditor!.edit((builder) => {
          builder.replace(
            document.lineAt(0).rangeIncludingLineBreak,
            `import {Class1} from '../resourceIndex';`,
          );
        });

        (await ctrl.commit()).should.be.true;

        document.lineAt(0).text.should.equals(`import {Class1} from '../resourceIndex';`);
      });

      it('should add a single new import to the document top', async () => {
        const ctrl = await ImportManager.create(document);
        const declaration = index.declarationInfos.find(o => o.declaration.name === 'NotBarelExported');
        ctrl.addDeclarationImport(declaration!);
        (await ctrl.commit()).should.be.true;

        document.lineAt(0).text.should.equals(
          `import { NotBarelExported } from '../../server/indices/NotBarelExported';`,
        );
      });

      it('should add two new imports to the document top', async () => {
        const ctrl = await ImportManager.create(document);
        const declaration = index.declarationInfos.find(o => o.declaration.name === 'NotBarelExported');
        const declaration2 = index.declarationInfos.find(o => o.declaration.name === 'isString');

        ctrl.addDeclarationImport(declaration!).addDeclarationImport(declaration2!);
        (await ctrl.commit()).should.be.true;

        document.lineAt(0).text.should.equals(
          `import { NotBarelExported } from '../../server/indices/NotBarelExported';`,
        );
        document.lineAt(1).text.should.equals(
          `import { isString } from '../../server/indices/HelperFunctions';`,
        );
      });

      it('should add three new imports to the document top', async () => {
        const ctrl = await ImportManager.create(document);
        const declaration = index.declarationInfos.find(o => o.declaration.name === 'NotBarelExported');
        const declaration2 = index.declarationInfos.find(o => o.declaration.name === 'isString');
        const declaration3 = index.declarationInfos.find(o => o.declaration.name === 'myComponent');

        ctrl.addDeclarationImport(declaration!)
          .addDeclarationImport(declaration2!)
          .addDeclarationImport(declaration3!);

        (await ctrl.commit()).should.be.true;

        document.lineAt(0).text.should.equals(
          `import { NotBarelExported } from '../../server/indices/NotBarelExported';`,
        );
        document.lineAt(1).text.should.equals(
          `import { isString } from '../../server/indices/HelperFunctions';`,
        );
        document.lineAt(2).text.should.equals(
          `import { myComponent } from '../../server/indices/MyReactTemplate';`,
        );
      });

      it('should add a single new module import to the document top', async () => {
        const ctrl = await ImportManager.create(document);
        const declaration = index.declarationInfos.find(o => o.from === 'body-parser');
        ctrl.addDeclarationImport(declaration!);
        (await ctrl.commit()).should.be.true;

        document.lineAt(0).text.should.equals(`import * as bodyParser from 'body-parser';`);
      });

      it('should add a single default import to the document top', async () => {
        try {
          const ctrl = await ImportManager.create(document);
          const declaration = index.declarationInfos.find(
            o => o.declaration.name === 'myDefaultExportedFunction',
          );
          ctrl.addDeclarationImport(declaration!);
          (await ctrl.commit()).should.be.true;

          stub.should.not.be.called;
          document.lineAt(0).text.should.equals(
            `import myDefaultExportedFunction from '../../server/indices/defaultExport/lateDefaultExportedElement';`,
          );
        } finally {
        }
      });

      it('should add a single aliased named import when names are conflicting', async () => {
        try {
          const ctrl = await ImportManager.create(document);
          const declarations = index.declarationInfos.filter(o => o.declaration.name === 'FancierLibraryClass');
          ctrl.addDeclarationImport(declarations[0]).addDeclarationImport(declarations[1]);
          (await ctrl.commit()).should.be.true;

          document.lineAt(0).text.should.equal(
            `import { FancierLibraryClass } from 'fancy-library/FancierLibraryClass';`,
          );
          document.lineAt(1).text.should.equal(
            `import { Class1, FancierLibraryClass as ALIASED_IMPORT } from '../../server/indices';`,
          );
        } finally {
        }
      });

      it('should add a specifier to an existing import', async () => {
        const ctrl = await ImportManager.create(document);
        const declaration = index.declarationInfos.find(o => o.declaration.name === 'Class2');
        ctrl.addDeclarationImport(declaration!);
        (await ctrl.commit()).should.be.true;

        document.lineAt(0).text.should.equals(`import { Class1, Class2 } from '../../server/indices';`);
      });

      it('should add multiple specifier to an existing import', async () => {
        const ctrl = await ImportManager.create(document);
        const declaration = index.declarationInfos.find(o => o.declaration.name === 'Class2');
        const declaration2 = index.declarationInfos.find(o => o.declaration.name === 'Class3');

        ctrl.addDeclarationImport(declaration!).addDeclarationImport(declaration2!);
        (await ctrl.commit()).should.be.true;

        document.lineAt(0).text.should.equals(`import { Class1, Class2, Class3 } from '../../server/indices';`);
      });

      it('should add a specifier with a default (first) and a normal (second) import to the doc', async () => {
        try {
          const ctrl = await ImportManager.create(document);
          const declaration = index.declarationInfos.find(o => o.declaration.name === 'multiExport');
          const declaration2 = index.declarationInfos.find(o => o.declaration.name === 'MultiExportClass');

          try {
            ctrl.addDeclarationImport(declaration!);
            ctrl.addDeclarationImport(declaration2!);
          } catch (e) {
            console.log(e);
          }
          (await ctrl.commit()).should.be.true;

          document.lineAt(0).text.should.equals(
            `import multiExport, { MultiExportClass } ` +
            `from '../../server/indices/defaultExport/multiExport';`,
          );
        } finally {
        }
      });

      it('should add a specifier to an import and a new import', async () => {
        const ctrl = await ImportManager.create(document);
        const declaration1 = index.declarationInfos.find(o => o.declaration.name === 'Class2');
        const declaration2 = index.declarationInfos.find(o => o.declaration.name === 'myComponent');

        await ctrl.addDeclarationImport(declaration1!)
          .addDeclarationImport(declaration2!)
          .commit();

        document.lineAt(0).text.should.equals(
          `import { myComponent } from '../../server/indices/MyReactTemplate';`,
        );
        document.lineAt(1).text.should.equals(`import { Class1, Class2 } from '../../server/indices';`);
      });

      it('should convert a default import when a normal specifier is added', async () => {
        try {
          const ctrl = await ImportManager.create(document);
          let declaration = index.declarationInfos.find(o => o.declaration.name === 'multiExport');
          await ctrl.addDeclarationImport(declaration!).commit();

          document.lineAt(0).text.should.equals(
            `import multiExport from '../../server/indices/defaultExport/multiExport';`,
          );

          declaration = index.declarationInfos.find(o => o.declaration.name === 'MultiExportClass');
          await ctrl.addDeclarationImport(declaration!).commit();

          document.lineAt(0).text.should.equals(
            `import multiExport, { MultiExportClass } ` +
            `from '../../server/indices/defaultExport/multiExport';`,
          );
        } finally {
        }
      });

      it('should convert a normal import when a default specifier is added', async () => {
        try {
          const ctrl = await ImportManager.create(document);
          let declaration = index.declarationInfos.find(o => o.declaration.name === 'MultiExportClass');
          await ctrl.addDeclarationImport(declaration!).commit();

          document.lineAt(0).text.should.equals(
            `import { MultiExportClass } from '../../server/indices/defaultExport/multiExport';`,
          );

          declaration = index.declarationInfos.find(o => o.declaration.name === 'multiExport');
          ctrl.addDeclarationImport(declaration!);
          await ctrl.commit();

          document.lineAt(0).text.should.equals(
            `import multiExport, { MultiExportClass } ` +
            `from '../../server/indices/defaultExport/multiExport';`,
          );
        } finally {
        }
      });

      it('should render the optimized import', async () => {
        await window.activeTextEditor!.edit((builder) => {
          builder.insert(new Position(5, 0), 'const foobar = new Class2();\n');
        });

        const ctrl = await ImportManager.create(document);
        const declaration1 = index.declarationInfos.find(o => o.declaration.name === 'Class2');
        const declaration2 = index.declarationInfos.find(o => o.declaration.name === 'MultiExportClass');

        await ctrl.addDeclarationImport(declaration1!)
          .addDeclarationImport(declaration2!)
          .commit();

        document.lineAt(0).text.should.equals(
          `import { MultiExportClass } from '../../server/indices/defaultExport/multiExport';`,
        );
        document.lineAt(1).text.should.equals(
          `import { Class1, Class2 } from '../../server/indices';`,
        );

        await ctrl.organizeImports().commit();

        document.lineAt(0).text.should.equals(
          `import { Class1, Class2 } from '../../server/indices';`,
        );
        document.lineAt(1).text.should.equals('');
      });

      it('should render sorted imports when optimizing', async () => {
        await window.activeTextEditor!.edit((builder) => {
          builder.insert(
            new Position(0, 0),
            `import { MultiExportClass } from '../../server/indices/defaultExport/multiExport';\n`,
          );
          builder.insert(new Position(5, 0), 'const foobar = new MultiExportClass();\n');
        });
        const ctrl = await ImportManager.create(document);

        await ctrl.organizeImports().commit();

        document.lineAt(1).text.should.equals(
          `import { MultiExportClass } from '../../server/indices/defaultExport/multiExport';`,
        );
        document.lineAt(0).text.should.equals(
          `import { Class1 } from '../../server/indices';`,
        );
      });

      it('should render sorted specifiers when optimizing', async () => {
        await window.activeTextEditor!.edit((builder) => {
          builder.insert(new Position(0, 9), 'Class2, ');
          builder.insert(new Position(5, 0), 'const foobar = new Class2();\n');
        });
        const ctrl = await ImportManager.create(document);

        await ctrl.organizeImports().commit();

        document.lineAt(0).text.should.equals(
          `import { Class1, Class2 } from '../../server/indices';`,
        );
      });

      describe('resolver.promptForSpecifiers: false', () => {

        before(async () => {
          const config = workspace.getConfiguration('typescriptHero');
          await config.update('resolver.promptForSpecifiers', false);
        });

        after(async () => {
          const config = workspace.getConfiguration('typescriptHero');
          await config.update('resolver.promptForSpecifiers', true);
        });

        it('should not ask for a default alias', async () => {
          try {
            const ctrl = await ImportManager.create(document);
            const declaration = index.declarationInfos.find(o => o.declaration.name === 'multiExport');
            await ctrl.addDeclarationImport(declaration!).commit();

            document.lineAt(0).text.should.equals(
              `import multiExport from '../../server/indices/defaultExport/multiExport';`,
            );

            stub.should.not.be.called;
          } finally {
          }
        });

        it('should not ask for an alias on duplicate specifiers', async () => {
          try {
            const ctrl = await ImportManager.create(document);
            const declarations = index.declarationInfos.filter(o => o.declaration.name === 'FancierLibraryClass');
            ctrl.addDeclarationImport(declarations[0]).addDeclarationImport(declarations[1]);
            (await ctrl.commit()).should.be.true;

            document.lineAt(0).text.should.equal(
              `import { FancierLibraryClass } from 'fancy-library/FancierLibraryClass';`,
            );
            document.lineAt(1).text.should.equal(
              `import { Class1, FancierLibraryClass } from '../../server/indices';`,
            );

            stub.should.not.be.called;
          } finally {
          }
        });

      });

    });

  });

});

describe.skip('ImportManager with .tsx files', () => {

  const rootPath = workspace.workspaceFolders![0].uri.fsPath;
  const file = join(rootPath, 'extension/managers/ImportManagerFile.tsx');
  let document: TextDocument;
  let documentText: string;
  let index: DeclarationIndex;
  let files: string[];

  before(async () => {
    const config = new VscodeExtensionConfig(workspace.workspaceFolders![0].uri);
    files = await findFiles(config, workspace.workspaceFolders![0]);

    index = new DeclarationIndex(Container.get(iocSymbols.typescriptParser), rootPath);
    await index.buildIndex(files);

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

  it('should not remove "react" since it is ignored in config', async () => {
    const ctrl = await ImportManager.create(document);
    ctrl.organizeImports();

    (ctrl as any).imports.should.have.lengthOf(1);
    (ctrl as any).imports[0].libraryName.should.equal('react');
  });

});
