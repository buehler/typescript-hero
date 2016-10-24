import { Injector } from '../../src/IoC';
import { ResolveIndex } from '../../src/caches/ResolveIndex';
import { TsFile } from '../../src/models/TsResource';
import { DocumentController } from '../../src/controllers/DocumentController';
import { join } from 'path';
import * as chai from 'chai';
import { Position, Range, TextDocument, window, workspace } from 'vscode';

chai.should();

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

        it('should add an import to the virtual doc if there are no conflicts.', async done => {
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

        it('should add a text edit to the virtual doc if there are no conflicts.', async done => {
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

    });

});
