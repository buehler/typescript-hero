import { ResolveQuickPickItem } from '../../../src/common/quick-pick-items';
import { File } from '../../../src/common/ts-parsing/resources';
import { findFiles } from '../../../src/extension/extensions/ImportResolveExtension';
import { ImportManager } from '../../../src/extension/managers';
import { ImportProxy } from '../../../src/extension/proxy-objects/ImportProxy';
import { VscodeExtensionConfig } from '../../../src/extension/VscodeExtensionConfig';
import { DeclarationIndex } from '../../../src/server/indices/DeclarationIndex';
import { Container } from '../../../src/server/IoC';
import * as chai from 'chai';
import { join } from 'path';
import sinon = require('sinon');
import sinonChai = require('sinon-chai');
import { Position, Range, TextDocument, window, workspace } from 'vscode';

const should = chai.should();
chai.use(sinonChai);

/**
 * Mock window input box.
 * 
 * @param {string} returnValue
 * @returns {sinon.SinonStub}
 */
function mockInputBox(returnValue: string): sinon.SinonStub {
    return sinon.stub(window, 'showInputBox', () => {
        return Promise.resolve(returnValue);
    });
}

/**
 * Restore window.
 * 
 * @param {sinon.SinonStub} stub
 */
function restoreInputBox(stub: sinon.SinonStub): void {
    stub.restore();
}

describe('ImportManager', () => {

    const file = join(workspace.rootPath, 'extension/managers/ImportManagerFile.ts');
    let document: TextDocument,
        documentText: string,
        index: DeclarationIndex,
        files: string[];

    before(async done => {
        const config = new VscodeExtensionConfig();
        files = await findFiles(config);

        index = Container.get(DeclarationIndex);
        await index.buildIndex(files, workspace.rootPath);

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
            try {
                const ctrl = await ImportManager.create(document);
                ctrl.should.be.an.instanceof(ImportManager);

                done();
            } catch (e) {
                done(e);
            }
        });

        it('should parse the document', async done => {
            try {
                const ctrl = await ImportManager.create(document);
                (ctrl as any).parsedDocument.should.be.an.instanceof(File);

                done();
            } catch (e) {
                done(e);
            }
        });

        it('should add an import proxy for a named import', async done => {
            try {
                const ctrl = await ImportManager.create(document),
                    imps = (ctrl as any).parsedDocument.imports;

                imps[0].should.be.an.instanceof(ImportProxy);
                should.not.exist(imps[0].defaultAlias);

                done();
            } catch (e) {
                done(e);
            }
        });

        it('should add an import proxy for a default import', async done => {
            try {
                await window.activeTextEditor.edit(builder => {
                    builder.replace(new Range(
                        new Position(0, 0),
                        new Position(1, 0)
                    ), `import myDefaultExportedFunction from '../defaultExport/lateDefaultExportedElement';\n`);
                });

                const ctrl = await ImportManager.create(document),
                    imps = (ctrl as any).parsedDocument.imports;

                imps[0].should.be.an.instanceof(ImportProxy);
                imps[0].defaultAlias.should.equal('myDefaultExportedFunction');

                done();
            } catch (e) {
                done(e);
            }
        });

        it('should add multiple import proxies', async done => {
            try {
                await window.activeTextEditor.edit(builder => {
                    builder.insert(
                        new Position(0, 0),
                        `import myDefaultExportedFunction from '../defaultExport/lateDefaultExportedElement';\n`
                    );
                });

                const ctrl = await ImportManager.create(document),
                    imps = (ctrl as any).parsedDocument.imports;

                imps[0].should.be.an.instanceof(ImportProxy);
                imps[0].defaultAlias.should.equal('myDefaultExportedFunction');
                imps[1].should.be.an.instanceof(ImportProxy);
                should.not.exist(imps[1].defaultAlias);

                done();
            } catch (e) {
                done(e);
            }
        });

        it('should not add a proxy for a namespace import', async done => {
            try {
                await window.activeTextEditor.edit(builder => {
                    builder.replace(new Range(
                        new Position(0, 0),
                        new Position(1, 0)
                    ), `import * as bodyParser from 'body-parser';\n`);
                });

                const ctrl = await ImportManager.create(document),
                    imps = (ctrl as any).parsedDocument.imports;

                imps.should.have.lengthOf(1);
                imps[0].should.not.be.an.instanceof(ImportProxy);

                done();
            } catch (e) {
                done(e);
            }
        });

        it('should not add a proxy for an external import', async done => {
            try {
                await window.activeTextEditor.edit(builder => {
                    builder.replace(new Range(
                        new Position(0, 0),
                        new Position(1, 0)
                    ), `import bodyParser = require('body-parser');\n`);
                });

                const ctrl = await ImportManager.create(document),
                    imps = (ctrl as any).parsedDocument.imports;

                imps.should.have.lengthOf(1);
                imps[0].should.not.be.an.instanceof(ImportProxy);

                done();
            } catch (e) {
                done(e);
            }
        });

        it('should not add a proxy for a string import', async done => {
            try {
                await window.activeTextEditor.edit(builder => {
                    builder.replace(new Range(
                        new Position(0, 0),
                        new Position(1, 0)
                    ), `import 'body-parser';\n`);
                });

                const ctrl = await ImportManager.create(document),
                    imps = (ctrl as any).parsedDocument.imports;

                imps.should.have.lengthOf(1);
                imps[0].should.not.be.an.instanceof(ImportProxy);

                done();
            } catch (e) {
                done(e);
            }
        });

    });

    describe('addDeclarationImport()', () => {

        it('should add a normal import to the document.', async done => {
            try {
                const ctrl = await ImportManager.create(document);
                const declaration = index.declarationInfos.find(o => o.declaration.name === 'NotBarelExported');
                ctrl.addDeclarationImport(declaration!);

                (ctrl as any).imports.should.have.lengthOf(2);
                (ctrl as any).imports[1].libraryName.should.equal('../resourceIndex/NotBarelExported');
                (ctrl as any).imports[1].specifiers[0].specifier.should.equal('NotBarelExported');

                done();
            } catch (e) {
                done(e);
            }
        });

        it('should add a module import to the import index.', async done => {
            try {
                const ctrl = await ImportManager.create(document);
                const declaration = index.declarationInfos.find(o => o.from === 'body-parser');
                ctrl.addDeclarationImport(declaration!);

                (ctrl as any).imports.should.have.lengthOf(2);
                (ctrl as any).imports[1].libraryName.should.equal('body-parser');
                (ctrl as any).imports[1].should.not.be.an.instanceof(ImportProxy);

                done();
            } catch (e) {
                done(e);
            }
        });

        it('should add a default import to the import index.', async done => {
            try {
                const ctrl = await ImportManager.create(document);
                const declaration = index.declarationInfos.find(
                    o => o.declaration.name === 'myDefaultExportedFunction'
                );
                ctrl.addDeclarationImport(declaration!);

                (ctrl as any).imports.should.have.lengthOf(2);
                (ctrl as any).imports[1].libraryName.should.equal('../defaultExport/lateDefaultExportedElement');
                (ctrl as any).imports[1].defaultPurposal.should.equal('myDefaultExportedFunction');
                should.not.exist((ctrl as any).imports[1].defaultAlias);

                done();
            } catch (e) {
                done(e);
            }
        });

        it('should add multiple imports to the import index.', async done => {
            try {
                const ctrl = await ImportManager.create(document);
                const declarations = index.declarationInfos.filter(o => o.declaration.name === 'FancierLibraryClass');
                ctrl.addDeclarationImport(declarations[0]).addDeclarationImport(declarations[1]);

                (ctrl as any).imports.should.have.lengthOf(2);
                (ctrl as any).imports[0].specifiers[1].specifier.should.equal('FancierLibraryClass');
                (ctrl as any).imports[1].libraryName.should.equal('fancy-library/FancierLibraryClass');
                (ctrl as any).imports[1].specifiers[0].specifier.should.equal('FancierLibraryClass');

                done();
            } catch (e) {
                done(e);
            }
        });

        it('should add an import to an existing import index item.', async done => {
            try {
                const ctrl = await ImportManager.create(document);
                const declaration = index.declarationInfos.find(o => o.declaration.name === 'Class2'),
                    declaration2 = index.declarationInfos.find(o => o.declaration.name === 'Class3');

                ctrl.addDeclarationImport(declaration!).addDeclarationImport(declaration2!);

                (ctrl as any).imports.should.have.lengthOf(1);
                (ctrl as any).imports[0].specifiers[0].specifier.should.equal('Class1');
                (ctrl as any).imports[0].specifiers[1].specifier.should.equal('Class2');
                (ctrl as any).imports[0].specifiers[2].specifier.should.equal('Class3');

                done();
            } catch (e) {
                done(e);
            }
        });

        it('should not add the same specifier twice', async done => {
            try {
                const ctrl = await ImportManager.create(document);
                const declaration = index.declarationInfos.find(o => o.declaration.name === 'Class2');

                ctrl.addDeclarationImport(declaration!);

                (ctrl as any).imports.should.have.lengthOf(1);
                (ctrl as any).imports[0].specifiers.should.have.lengthOf(2);

                ctrl.addDeclarationImport(declaration!);

                (ctrl as any).imports[0].specifiers.should.have.lengthOf(2);

                done();
            } catch (e) {
                done(e);
            }
        });

    });

    describe('addMissingImports()', () => {

        it('should add a missing imports to the import index', async done => {
            try {
                await window.activeTextEditor.edit(builder => {
                    builder.insert(new Position(5, 0), `const foobar = new Class2();\n`);
                });
                const ctrl = await ImportManager.create(document);
                ctrl.addMissingImports(index);

                (ctrl as any).imports.should.have.lengthOf(1);
                (ctrl as any).imports[0].specifiers[0].specifier.should.equal('Class1');
                (ctrl as any).imports[0].specifiers[1].specifier.should.equal('Class2');

                done();
            } catch (e) {
                done(e);
            }
        });

        it('should add multiple missing imports for a document', async done => {
            try {
                await window.activeTextEditor.edit(builder => {
                    builder.insert(
                        new Position(5, 0),
                        `const foobar = new Class2();\nconst foobaz = new Class3();` +
                        `\nconst barbaz = new NotBarelExported();\n`
                    );
                });
                const ctrl = await ImportManager.create(document);
                ctrl.addMissingImports(index);

                (ctrl as any).imports.should.have.lengthOf(2);
                (ctrl as any).imports[0].specifiers[0].specifier.should.equal('Class1');
                (ctrl as any).imports[0].specifiers[1].specifier.should.equal('Class2');
                (ctrl as any).imports[0].specifiers[2].specifier.should.equal('Class3');
                (ctrl as any).imports[1].libraryName.should.equal('../resourceIndex/NotBarelExported');
                (ctrl as any).imports[1].specifiers[0].specifier.should.equal('NotBarelExported');

                done();
            } catch (e) {
                done(e);
            }
        });

        it('should create a user decision specifier if multiple delcarations are found', async done => {
            try {
                await window.activeTextEditor.edit(builder => {
                    builder.insert(
                        new Position(5, 0),
                        `const foobar = new FancierLibraryClass();\n`
                    );
                });
                const ctrl = await ImportManager.create(document);
                ctrl.addMissingImports(index);

                (ctrl as any).imports.should.have.lengthOf(1);
                (ctrl as any).userImportDecisions['FancierLibraryClass'].should.be.an('array').with.lengthOf(2);

                done();
            } catch (e) {
                done(e);
            }
        });

    });

    describe('organizeImports()', () => {

        it('should remove an unused import', async done => {
            try {
                const ctrl = await ImportManager.create(document);
                const declaration = index.declarationInfos.find(o => o.declaration.name === 'myComponent');
                ctrl.addDeclarationImport(declaration!);

                (ctrl as any).imports.should.have.lengthOf(2);
                (ctrl as any).imports[1].specifiers[0].specifier.should.equal('myComponent');

                ctrl.organizeImports();

                (ctrl as any).imports.should.have.lengthOf(1);
                (ctrl as any).imports[0].specifiers[0].specifier.should.equal('Class1');

                done();
            } catch (e) {
                done(e);
            }
        });

        it('should remove an unused specifier from an import', async done => {
            try {
                const ctrl = await ImportManager.create(document);
                const declaration = index.declarationInfos.find(o => o.declaration.name === 'Class2');
                ctrl.addDeclarationImport(declaration!);

                (ctrl as any).imports[0].specifiers.should.have.lengthOf(2);

                ctrl.organizeImports();

                (ctrl as any).imports[0].specifiers.should.have.lengthOf(1);
                (ctrl as any).imports[0].specifiers[0].specifier.should.equal('Class1');

                done();
            } catch (e) {
                done(e);
            }
        });

        it('should not remove a string import', async done => {
            try {
                await window.activeTextEditor.edit(builder => {
                    builder.insert(
                        new Position(0, 0),
                        `import 'my-string-import';\n`
                    );
                });
                const ctrl = await ImportManager.create(document);

                (ctrl as any).imports.should.have.lengthOf(2);

                ctrl.organizeImports();

                (ctrl as any).imports.should.have.lengthOf(2);

                done();
            } catch (e) {
                done(e);
            }
        });

        it('should order imports alphabetically', async done => {
            try {
                await window.activeTextEditor.edit(builder => {
                    builder.insert(
                        new Position(1, 0),
                        `import { AddImportSameDirectory } from '../resolveExtension/sameDirectory';\n`
                    );
                    builder.insert(new Position(6, 0), `const foo = AddImportSameDirectory;\n`);
                });
                const ctrl = await ImportManager.create(document);

                (ctrl as any).imports[0].libraryName.should.equal('../resourceIndex');

                ctrl.organizeImports();

                (ctrl as any).imports[0].libraryName.should.equal('../resolveExtension/sameDirectory');

                done();
            } catch (e) {
                done(e);
            }
        });

        it('should order string imports before normal imports', async done => {
            try {
                await window.activeTextEditor.edit(builder => {
                    builder.insert(new Position(1, 0), `import 'foobar';\n`);
                });
                const ctrl = await ImportManager.create(document);

                (ctrl as any).imports[0].libraryName.should.not.equal('foobar');

                ctrl.organizeImports();

                (ctrl as any).imports[0].libraryName.should.equal('foobar');

                done();
            } catch (e) {
                done(e);
            }
        });

        it('should order specifiers alphabetically', async done => {
            try {
                await window.activeTextEditor.edit(builder => {
                    builder.replace(
                        document.lineAt(0).rangeIncludingLineBreak,
                        `import { Class2, Class1 } from '../resourceIndex';`
                    );
                    builder.insert(new Position(5, 0), `const foo = new Class2();\n`);
                });
                const ctrl = await ImportManager.create(document);

                (ctrl as any).imports[0].specifiers[0].specifier.should.equal('Class2');

                ctrl.organizeImports();

                (ctrl as any).imports[0].specifiers[0].specifier.should.equal('Class1');

                done();
            } catch (e) {
                done(e);
            }
        });

    });

    describe('commit()', () => {

        it('should not touch anything if nothing changed', async done => {
            try {
                const ctrl = await ImportManager.create(document);

                await window.activeTextEditor.edit(builder => {
                    builder.replace(
                        document.lineAt(0).rangeIncludingLineBreak,
                        `import {Class1} from '../resourceIndex';`
                    );
                });

                (await ctrl.commit()).should.be.true;

                document.lineAt(0).text.should.equals(`import {Class1} from '../resourceIndex';`);

                done();
            } catch (e) {
                done(e);
            }
        });

        it('should add a single new import to the document (top)', async done => {
            try {
                const ctrl = await ImportManager.create(document);
                const declaration = index.declarationInfos.find(o => o.declaration.name === 'NotBarelExported');
                ctrl.addDeclarationImport(declaration!);
                (await ctrl.commit()).should.be.true;

                document.lineAt(0).text.should.equals(
                    `import { NotBarelExported } from '../resourceIndex/NotBarelExported';`
                );

                done();
            } catch (e) {
                done(e);
            }
        });

        it('should add two new imports to the document (top)', async done => {
            try {
                const ctrl = await ImportManager.create(document);
                const declaration = index.declarationInfos.find(o => o.declaration.name === 'NotBarelExported'),
                    declaration2 = index.declarationInfos.find(o => o.declaration.name === 'AlreadyImported');
                ctrl.addDeclarationImport(declaration!).addDeclarationImport(declaration2!);
                (await ctrl.commit()).should.be.true;

                document.lineAt(0).text.should.equals(
                    `import { NotBarelExported } from '../resourceIndex/NotBarelExported';`
                );
                document.lineAt(1).text.should.equals(
                    `import { AlreadyImported } from '../compconstionProvider/codeCompconstionImports';`
                );

                done();
            } catch (e) {
                done(e);
            }
        });

        it('should add three new imports to the document (top)', async done => {
            try {
                const ctrl = await ImportManager.create(document);
                const declaration = index.declarationInfos.find(o => o.declaration.name === 'NotBarelExported'),
                    declaration2 = index.declarationInfos.find(o => o.declaration.name === 'AlreadyImported'),
                    declaration3 = index.declarationInfos.find(o => o.declaration.name === 'myComponent');
                ctrl.addDeclarationImport(declaration!)
                    .addDeclarationImport(declaration2!)
                    .addDeclarationImport(declaration3!);

                (await ctrl.commit()).should.be.true;

                document.lineAt(0).text.should.equals(
                    `import { NotBarelExported } from '../resourceIndex/NotBarelExported';`
                );
                document.lineAt(1).text.should.equals(
                    `import { AlreadyImported } from '../compconstionProvider/codeCompconstionImports';`
                );
                document.lineAt(2).text.should.equals(
                    `import { myComponent } from '../MyReactTemplate';`
                );

                done();
            } catch (e) {
                done(e);
            }
        });

        it('should add a single new module import to the document (top)', async done => {
            try {
                const ctrl = await ImportManager.create(document);
                const declaration = index.declarationInfos.find(o => o.from === 'body-parser');
                ctrl.addDeclarationImport(declaration!);
                (await ctrl.commit()).should.be.true;

                document.lineAt(0).text.should.equals(`import * as bodyParser from 'body-parser';`);

                done();
            } catch (e) {
                done(e);
            }
        });

        it('should add a single default import to the document (top)', async done => {
            const stub = mockInputBox('DEFAULT_IMPORT');
            try {
                const ctrl = await ImportManager.create(document);
                const declaration = index.declarationInfos.find(
                    o => o.declaration.name === 'myDefaultExportedFunction'
                );
                ctrl.addDeclarationImport(declaration!);
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
            const stub = mockInputBox('ALIASED_IMPORT');
            try {
                const ctrl = await ImportManager.create(document);
                const declarations = index.declarationInfos.filter(o => o.declaration.name === 'FancierLibraryClass');
                ctrl.addDeclarationImport(declarations[0]).addDeclarationImport(declarations[1]);
                (await ctrl.commit()).should.be.true;

                document.lineAt(0).text.should.equal(
                    `import { FancierLibraryClass } from 'fancy-library/FancierLibraryClass';`
                );
                document.lineAt(1).text.should.equal(
                    `import { Class1, FancierLibraryClass as ALIASED_IMPORT } from '../resourceIndex';`
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
                const ctrl = await ImportManager.create(document);
                const declaration = index.declarationInfos.find(o => o.declaration.name === 'Class2');
                ctrl.addDeclarationImport(declaration!);
                (await ctrl.commit()).should.be.true;

                document.lineAt(0).text.should.equals(`import { Class1, Class2 } from '../resourceIndex';`);

                done();
            } catch (e) {
                done(e);
            }
        });

        it('should add multiple specifier to an existing import', async done => {
            try {
                const ctrl = await ImportManager.create(document);
                const declaration = index.declarationInfos.find(o => o.declaration.name === 'Class2'),
                    declaration2 = index.declarationInfos.find(o => o.declaration.name === 'Class3');
                ctrl.addDeclarationImport(declaration!).addDeclarationImport(declaration2!);
                (await ctrl.commit()).should.be.true;

                document.lineAt(0).text.should.equals(`import { Class1, Class2, Class3 } from '../resourceIndex';`);

                done();
            } catch (e) {
                done(e);
            }
        });

        it('should add a specifier with a default (first) and a normal (second) import to the doc', async done => {
            const stub = mockInputBox('DEFAULT_IMPORT');
            try {
                const ctrl = await ImportManager.create(document);
                const declaration = index.declarationInfos.find(o => o.declaration.name === 'multiExport'),
                    declaration2 = index.declarationInfos.find(o => o.declaration.name === 'MultiExportClass');
                ctrl.addDeclarationImport(declaration!).addDeclarationImport(declaration2!);
                (await ctrl.commit()).should.be.true;

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

        it('should add a specifier to an import and a new import', async done => {
            try {
                const ctrl = await ImportManager.create(document);
                const declaration1 = index.declarationInfos.find(o => o.declaration.name === 'Class2'),
                    declaration2 = index.declarationInfos.find(o => o.declaration.name === 'myComponent');

                await ctrl.addDeclarationImport(declaration1!)
                    .addDeclarationImport(declaration2!)
                    .commit();

                document.lineAt(0).text.should.equals(`import { myComponent } from '../MyReactTemplate';`);
                document.lineAt(1).text.should.equals(`import { Class1, Class2 } from '../resourceIndex';`);

                done();
            } catch (e) {
                done(e);
            }
        });

        it('should convert a default import when a normal specifier is added', async done => {
            const stub = mockInputBox('DEFAULT_IMPORT');
            try {
                const ctrl = await ImportManager.create(document);
                let declaration = index.declarationInfos.find(o => o.declaration.name === 'multiExport');
                await ctrl.addDeclarationImport(declaration!).commit();

                document.lineAt(0).text.should.equals(`import DEFAULT_IMPORT from '../defaultExport/multiExport';`);

                declaration = index.declarationInfos.find(o => o.declaration.name === 'MultiExportClass');
                await ctrl.addDeclarationImport(declaration!).commit();

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
            const stub = mockInputBox('DEFAULT_IMPORT');
            try {
                const ctrl = await ImportManager.create(document);
                let declaration = index.declarationInfos.find(o => o.declaration.name === 'MultiExportClass');
                await ctrl.addDeclarationImport(declaration!).commit();

                document.lineAt(0).text.should.equals(
                    `import { MultiExportClass } from '../defaultExport/multiExport';`
                );

                declaration = index.declarationInfos.find(o => o.declaration.name === 'multiExport');
                ctrl.addDeclarationImport(declaration!);
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
                    builder.insert(new Position(5, 0), 'const foobar = new Class2();\n');
                });
                const ctrl = await ImportManager.create(document);
                const declaration1 = index.declarationInfos.find(o => o.declaration.name === 'Class2'),
                    declaration2 = index.declarationInfos.find(o => o.declaration.name === 'MultiExportClass');

                await ctrl.addDeclarationImport(declaration1!)
                    .addDeclarationImport(declaration2!)
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
                    builder.insert(
                        new Position(1, 0),
                        `import { MultiExportClass } from '../defaultExport/multiExport';`
                    );
                    builder.insert(new Position(5, 0), 'const foobar = new MultiExportClass();\n');
                });
                const ctrl = await ImportManager.create(document);

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
                    builder.insert(new Position(5, 0), 'const foobar = new Class2();\n');
                });
                const ctrl = await ImportManager.create(document);

                await ctrl.organizeImports().commit();

                document.lineAt(0).text.should.equals(
                    `import { Class1, Class2 } from '../resourceIndex';`
                );
                done();
            } catch (e) {
                done(e);
            }
        });

        it('should ask which declaration should be used on multiple options (add missing)', async done => {
            let stub: sinon.SinonStub | undefined;
            try {
                const declarations = index.declarationInfos.filter(o => o.declaration.name === 'FancierLibraryClass');
                stub = sinon.stub(window, 'showQuickPick', () => {
                    return Promise.resolve(new ResolveQuickPickItem(declarations[0]));
                });
                await window.activeTextEditor.edit(builder => {
                    builder.insert(new Position(5, 0), 'const foobar = new FancierLibraryClass();\n');
                });
                const ctrl = await ImportManager.create(document);

                await ctrl.addMissingImports(index).commit();

                stub.should.be.calledOnce;

                done();
            } catch (e) {
                done(e);
            } finally {
                if (stub) {
                    stub.restore();
                }
            }
        });

    });

});
