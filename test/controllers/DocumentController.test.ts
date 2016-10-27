import { TsNamespaceImport } from '../../src/models/TsImport';
import { Injector } from '../../src/IoC';
import { ResolveIndex } from '../../src/caches/ResolveIndex';
import { TsFile } from '../../src/models/TsResource';
import { DocumentController } from '../../src/controllers/DocumentController';
import { join } from 'path';
import * as chai from 'chai';
import { Position, Range, TextDocument, window, workspace } from 'vscode';
import sinon = require('sinon');
import sinonChai = require('sinon-chai');

let should = chai.should();
chai.use(sinonChai);

function mockInputBox(returnValue: string): sinon.SinonStub {
    return sinon.stub(window, 'showInputBox', (options?, token?) => {
        return Promise.resolve(returnValue);
    });
}

function restoreInputBox(stub: sinon.SinonStub): void {
    stub.restore();
}

describe('DocumentController', () => {

    const file = join(workspace.rootPath, 'controllers/DocumentControllerFile.ts');
    let document: TextDocument,
        documentText: string,
        index: ResolveIndex;

    before(async done => {
        index = Injector.get(ResolveIndex);
        await index.buildIndex();
        document = await workspace.openTextDocument(file);
        await window.showTextDocument(document);
        documentText = document.getText();
        done();
    });

    afterEach(async done => {
        await window.activeTextEditor.edit(builder => {
            builder.delete(new Range(
                new Position(0, 0),
                document.lineAt(document.lineCount - 1).rangeIncludingLineBreak.end
            ));
            builder.insert(new Position(0, 0), documentText);
        });
        done();
    });

    describe('static create()', () => {

        it('should create a document controller', async done => {
            let ctrl = await DocumentController.create(document);
            ctrl.should.be.an.instanceof(DocumentController);
            done();
        });

        it('should parse the document', async done => {
            let ctrl = await DocumentController.create(document);
            (ctrl as any).parsedDocument.should.be.an.instanceof(TsFile);
            done();
        });

    });

    describe('addDeclarationImport()', () => {

        it('should add a normal import to the virtual doc if there are no conflicts.', async done => {
            try {
                let ctrl = await DocumentController.create(document);
                let declaration = index.declarationInfos.find(o => o.declaration.name === 'NotBarelExported');
                ctrl.addDeclarationImport(declaration);

                (ctrl as any).parsedDocument.imports.should.have.lengthOf(2);

                done();
            } catch (e) {
                done(e);
            }
        });

        it('should add a normal text edit to the virtual doc if there are no conflicts.', async done => {
            try {
                let ctrl = await DocumentController.create(document);
                let declaration = index.declarationInfos.find(o => o.declaration.name === 'NotBarelExported');
                ctrl.addDeclarationImport(declaration);

                (ctrl as any).edits.should.have.lengthOf(1);

                done();
            } catch (e) {
                done(e);
            }
        });

        it('should add a module import to the virtual doc if there are no conflicts.', async done => {
            try {
                let ctrl = await DocumentController.create(document);
                let declaration = index.declarationInfos.find(o => o.from === 'body-parser');
                ctrl.addDeclarationImport(declaration);

                (ctrl as any).parsedDocument.imports.should.have.lengthOf(2);
                (ctrl as any).parsedDocument.imports[1].should.be.an.instanceOf(TsNamespaceImport);

                done();
            } catch (e) {
                done(e);
            }
        });

        it('should add a promised default import edit to the virtual doc if there are no conflicts.', async done => {
            try {
                let ctrl = await DocumentController.create(document);
                let declaration = index.declarationInfos.find(o => o.declaration.name === 'myDefaultExportedFunction');
                ctrl.addDeclarationImport(declaration);

                (ctrl as any).parsedDocument.imports.should.have.lengthOf(1);
                (ctrl as any).edits.should.have.lengthOf(1);
                should.exist((ctrl as any).edits[0].then);

                done();
            } catch (e) {
                done(e);
            }
        });

        it('should add a promised named import edit to the virtual doc if there are conflicts.', async done => {
            try {
                let ctrl = await DocumentController.create(document);
                let declarations = index.declarationInfos.filter(o => o.declaration.name === 'FancierLibraryClass');
                ctrl.addDeclarationImport(declarations[0]);
                ctrl.addDeclarationImport(declarations[1]);

                (ctrl as any).parsedDocument.imports.should.have.lengthOf(1);
                (ctrl as any).edits.should.have.lengthOf(2);
                should.not.exist((ctrl as any).edits[0].then);
                should.exist((ctrl as any).edits[1].then);

                done();
            } catch (e) {
                done(e);
            }
        });

        it('should add an edit to the virtual doc if there is already an import.', async done => {
            try {
                let ctrl = await DocumentController.create(document);
                let declaration = index.declarationInfos.find(o => o.declaration.name === 'Class2');
                ctrl.addDeclarationImport(declaration);

                (ctrl as any).edits.should.have.lengthOf(1);

                done();
            } catch (e) {
                done(e);
            }
        });

        it('should not add an import to the virtual doc if there is already an import.', async done => {
            try {
                let ctrl = await DocumentController.create(document);
                let declaration = index.declarationInfos.find(o => o.declaration.name === 'Class2');
                ctrl.addDeclarationImport(declaration);

                (ctrl as any).parsedDocument.imports.should.have.lengthOf(1);
                (ctrl as any).parsedDocument.imports[0].specifiers.should.have.lengthOf(2);

                done();
            } catch (e) {
                done(e);
            }
        });

    });

    describe('organizeImports()', () => {

        it('should remove an unused import', async done => {
            try {
                let ctrl = await DocumentController.create(document);
                let declaration = index.declarationInfos.find(o => o.declaration.name === 'myComponent');
                ctrl.addDeclarationImport(declaration);

                (ctrl as any).edits[0]._newText.should.equals(`import { myComponent } from '../MyReactTemplate';\n`);

                ctrl.organizeImports();

                (ctrl as any).edits[3]._newText.should.equals(`import { Class1 } from '../resourceIndex';\n`);

                done();
            } catch (e) {
                done(e);
            }
        });

        it('should remove an unused specifier from an import', async done => {
            try {
                let ctrl = await DocumentController.create(document);
                let declaration = index.declarationInfos.find(o => o.declaration.name === 'Class2');
                ctrl.addDeclarationImport(declaration);

                (ctrl as any).edits[0]._newText.should.equals(`import { Class1, Class2 } from '../resourceIndex';\n`);

                ctrl.organizeImports();

                (ctrl as any).edits[2]._newText.should.equals(`import { Class1 } from '../resourceIndex';\n`);

                done();
            } catch (e) {
                done(e);
            }
        });

        it('should add an edit (delete) for each import and one for insert (top)', async done => {
            try {
                let ctrl = await DocumentController.create(document);
                let declaration1 = index.declarationInfos.find(o => o.declaration.name === 'Class2'),
                    declaration2 = index.declarationInfos.find(o => o.declaration.name === 'myComponent');

                ctrl.addDeclarationImport(declaration1)
                    .addDeclarationImport(declaration2)
                    .organizeImports();

                (ctrl as any).edits.should.have.lengthOf(5);
                (ctrl as any).edits[2]._newText.should.equals('');
                (ctrl as any).edits[3]._newText.should.equals('');
                (ctrl as any).edits[4]._newText.should.not.equals('');

                done();
            } catch (e) {
                done(e);
            }
        });

    });

    describe('commit()', () => {

        it('should resolve if no edits are pending', async done => {
            try {
                let ctrl = await DocumentController.create(document);
                (ctrl as any).edits.should.have.lengthOf(0);
                (await ctrl.commit()).should.be.true;
                (ctrl as any).edits.should.have.lengthOf(0);
                done();
            } catch (e) {
                done(e);
            }
        });

        it('should add a single new import to the document (top)', async done => {
            try {
                let ctrl = await DocumentController.create(document);
                let declaration = index.declarationInfos.find(o => o.declaration.name === 'NotBarelExported');
                ctrl.addDeclarationImport(declaration);
                (await ctrl.commit()).should.be.true;

                document.lineAt(0).text.should.equals(`import { NotBarelExported } from '../resourceIndex/NotBarelExported';`);

                done();
            } catch (e) {
                done(e);
            }
        });

        it('should add two new imports to the document (top)', async done => {
            try {
                let ctrl = await DocumentController.create(document);
                let declaration = index.declarationInfos.find(o => o.declaration.name === 'NotBarelExported'),
                    declaration2 = index.declarationInfos.find(o => o.declaration.name === 'AlreadyImported');
                ctrl.addDeclarationImport(declaration);
                ctrl.addDeclarationImport(declaration2);
                (await ctrl.commit()).should.be.true;

                document.lineAt(0).text.should.equals(`import { NotBarelExported } from '../resourceIndex/NotBarelExported';`);
                document.lineAt(1).text.should.equals(`import { AlreadyImported } from '../completionProvider/codeCompletionImports';`);

                done();
            } catch (e) {
                done(e);
            }
        });

        it('should add three new imports to the document (top)', async done => {
            try {
                let ctrl = await DocumentController.create(document);
                let declaration = index.declarationInfos.find(o => o.declaration.name === 'NotBarelExported'),
                    declaration2 = index.declarationInfos.find(o => o.declaration.name === 'AlreadyImported'),
                    declaration3 = index.declarationInfos.find(o => o.declaration.name === 'myComponent');
                ctrl.addDeclarationImport(declaration)
                    .addDeclarationImport(declaration2)
                    .addDeclarationImport(declaration3);

                (await ctrl.commit()).should.be.true;

                document.lineAt(0).text.should.equals(`import { NotBarelExported } from '../resourceIndex/NotBarelExported';`);
                document.lineAt(1).text.should.equals(`import { AlreadyImported } from '../completionProvider/codeCompletionImports';`);
                document.lineAt(2).text.should.equals(`import { myComponent } from '../MyReactTemplate';`);

                done();
            } catch (e) {
                done(e);
            }
        });

        it('should add a single new module import to the document (top)', async done => {
            try {
                let ctrl = await DocumentController.create(document);
                let declaration = index.declarationInfos.find(o => o.from === 'body-parser');
                ctrl.addDeclarationImport(declaration);
                (await ctrl.commit()).should.be.true;

                document.lineAt(0).text.should.equals(`import * as bodyParser from 'body-parser';`);

                done();
            } catch (e) {
                done(e);
            }
        });

        it('should add a single default import to the document (top)', async done => {
            let stub = mockInputBox('DEFAULT_IMPORT');
            try {
                let ctrl = await DocumentController.create(document);
                let declaration = index.declarationInfos.find(o => o.declaration.name === 'myDefaultExportedFunction');
                ctrl.addDeclarationImport(declaration);
                (await ctrl.commit()).should.be.true;

                stub.should.be.calledWithMatch({ value: 'myDefaultExportedFunction' });
                document.lineAt(0).text
                    .should.equals(`import DEFAULT_IMPORT from '../defaultExport/lateDefaultExportedElement';`);

                done();
            } catch (e) {
                done(e);
            } finally {
                restoreInputBox(stub);
            }
        });

        it('should add a single aliased named import when names are conflicting', async done => {
            let stub = mockInputBox('ALIASED_IMPORT');
            try {
                let ctrl = await DocumentController.create(document);
                let declarations = index.declarationInfos.filter(o => o.declaration.name === 'FancierLibraryClass');
                ctrl.addDeclarationImport(declarations[0]);
                (await ctrl.commit()).should.be.true;

                ctrl.addDeclarationImport(declarations[1]);
                (await ctrl.commit()).should.be.true;

                document.lineAt(0).text.should.equals(
                    `import { FancierLibraryClass as ALIASED_IMPORT } from 'fancy-library/FancierLibraryClass';`
                );

                done();
            } catch (e) {
                done(e);
            } finally {
                restoreInputBox(stub);
            }
        });

        it('should add a specifier to an existing import', async done => {
            try {
                let ctrl = await DocumentController.create(document);
                let declaration = index.declarationInfos.find(o => o.declaration.name === 'Class2');
                ctrl.addDeclarationImport(declaration);
                (await ctrl.commit()).should.be.true;

                document.lineAt(0).text.should.equals(`import { Class1, Class2 } from '../resourceIndex';`);

                done();
            } catch (e) {
                done(e);
            }
        });

        it('should add a specifier to an import and a new import', async done => {
            try {
                let ctrl = await DocumentController.create(document);
                let declaration1 = index.declarationInfos.find(o => o.declaration.name === 'Class2'),
                    declaration2 = index.declarationInfos.find(o => o.declaration.name === 'myComponent');

                await ctrl.addDeclarationImport(declaration1)
                    .addDeclarationImport(declaration2)
                    .commit();

                document.lineAt(0).text.should.equals(`import { myComponent } from '../MyReactTemplate';`);
                document.lineAt(1).text.should.equals(`import { Class1, Class2 } from '../resourceIndex';`);

                done();
            } catch (e) {
                done(e);
            }
        });

        it('should convert a default import when a normal specifier is added', async done => {
            let stub = mockInputBox('DEFAULT_IMPORT');
            try {
                let ctrl = await DocumentController.create(document);
                let declaration = index.declarationInfos.find(o => o.declaration.name === 'multiExport');
                await ctrl.addDeclarationImport(declaration).commit();

                document.lineAt(0).text.should.equals(`import DEFAULT_IMPORT from '../defaultExport/multiExport';`);

                declaration = index.declarationInfos.find(o => o.declaration.name === 'MultiExportClass');
                await ctrl.addDeclarationImport(declaration).commit();

                document.lineAt(0).text.should.equals(
                    `import { default as DEFAULT_IMPORT, MultiExportClass } from '../defaultExport/multiExport';`
                );

                done();
            } catch (e) {
                done(e);
            } finally {
                restoreInputBox(stub);
            }
        });

        it('should convert a normal import when a default specifier is added', async done => {
            let stub = mockInputBox('DEFAULT_IMPORT');
            try {
                let ctrl = await DocumentController.create(document);
                let declaration = index.declarationInfos.find(o => o.declaration.name === 'MultiExportClass');
                await ctrl.addDeclarationImport(declaration).commit();

                document.lineAt(0).text.should.equals(
                    `import { MultiExportClass } from '../defaultExport/multiExport';`
                );

                declaration = index.declarationInfos.find(o => o.declaration.name === 'multiExport');
                ctrl.addDeclarationImport(declaration);
                await ctrl.commit();

                document.lineAt(0).text.should.equals(
                    `import { default as DEFAULT_IMPORT, MultiExportClass } from '../defaultExport/multiExport';`
                );

                done();
            } catch (e) {
                done(e);
            } finally {
                restoreInputBox(stub);
            }
        });

        it('should render the optimized import', async done => {
            try {
                await window.activeTextEditor.edit(builder => {
                    builder.insert(new Position(5, 0), 'let foobar = new Class2();\n');
                });
                let ctrl = await DocumentController.create(document);
                let declaration1 = index.declarationInfos.find(o => o.declaration.name === 'Class2'),
                    declaration2 = index.declarationInfos.find(o => o.declaration.name === 'MultiExportClass');

                await ctrl.addDeclarationImport(declaration1)
                    .addDeclarationImport(declaration2)
                    .commit();

                document.lineAt(0).text.should.equals(
                    `import { MultiExportClass } from '../defaultExport/multiExport';`
                );
                document.lineAt(1).text.should.equals(
                    `import { Class1, Class2 } from '../resourceIndex';`
                );

                await ctrl.organizeImports().commit();

                document.lineAt(0).text.should.equals(
                    `import { Class1, Class2 } from '../resourceIndex';`
                );
                document.lineAt(1).text.should.equals('');

                done();
            } catch (e) {
                done(e);
            }
        });

        it('should render sorted imports when optimizing', async done => {
            try {
                await window.activeTextEditor.edit(builder => {
                    builder.insert(new Position(1, 0), `import { MultiExportClass } from '../defaultExport/multiExport';`);
                    builder.insert(new Position(5, 0), 'let foobar = new MultiExportClass();\n');
                });
                let ctrl = await DocumentController.create(document);

                await ctrl.organizeImports().commit();

                document.lineAt(0).text.should.equals(
                    `import { MultiExportClass } from '../defaultExport/multiExport';`
                );
                document.lineAt(1).text.should.equals(
                    `import { Class1 } from '../resourceIndex';`
                );
                done();
            } catch (e) {
                done(e);
            }
        });

        it('should render sorted specifiers when optimizing', async done => {
            try {
                await window.activeTextEditor.edit(builder => {
                    builder.insert(new Position(0, 9), 'Class2, ');
                    builder.insert(new Position(5, 0), 'let foobar = new Class2();\n');
                });
                let ctrl = await DocumentController.create(document);

                await ctrl.organizeImports().commit();

                document.lineAt(0).text.should.equals(
                    `import { Class1, Class2 } from '../resourceIndex';`
                );
                done();
            } catch (e) {
                done(e);
            }
        });

    });

});
