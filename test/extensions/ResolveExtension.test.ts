import { ResolveExtension } from '../../src/extensions/ResolveExtension';
import { Injector } from '../../src/IoC';
import { waitForWorkspace } from '../utilities';
import * as chai from 'chai';
import { join } from 'path';
import * as vscode from 'vscode';

chai.should();

describe('ResolveExtension', () => {

    let extension: any;

    before(async done => {
        extension = Injector.getAll<ResolveExtension>('Extension').find(o => o instanceof ResolveExtension);
        await waitForWorkspace();
        done();
    });

    describe('addImportToDocument', () => {

        const file = join(vscode.workspace.rootPath, 'resolveExtension/addImportToDocument.ts');
        let document: vscode.TextDocument;

        before(async done => {
            document = await vscode.workspace.openTextDocument(file);
            await vscode.window.showTextDocument(document);
            done();
        });

        afterEach(async done => {
            await vscode.window.activeTextEditor.edit(builder => {
                builder.delete(new vscode.Range(
                    new vscode.Position(0, 0),
                    document.lineAt(document.lineCount - 1).rangeIncludingLineBreak.end
                ));
            });
            done();
        });

        it('shoud write a module / namespace import correctly', async done => {
            try {
                let items = await extension.pickProvider.buildQuickPickList(document, 'bodyParser');
                await extension.addImportToDocument(items[0]);
                document.getText().should.equal(`import * as bodyParser from 'body-parser';\n`);
                done();
            } catch (e) {
                done(e);
            }
        });

        it('shoud write a named import correctly', async done => {
            try {
                let items = await extension.pickProvider.buildQuickPickList(document, 'Class1');
                await extension.addImportToDocument(items[0]);
                document.getText().should.equal(`import { Class1 } from '../resourceIndex';\n`);
                done();
            } catch (e) {
                done(e);
            }
        });

        it('shoud update a named import correcty', async done => {
            try {
                let items = await extension.pickProvider.buildQuickPickList(document, 'Class');
                await extension.addImportToDocument(items[0]);
                await extension.addImportToDocument(items[1]);
                document.getText().should.equal(`import { Class1, Class2 } from '../resourceIndex';\n`);
                done();
            } catch (e) {
                done(e);
            }
        });

        it('shoud use the correct relative path', async done => {
            try {
                let items = await extension.pickProvider.buildQuickPickList(document, 'StructuralSecondParentClass');
                await extension.addImportToDocument(items[0]);
                document.getText().should.match(/\.\.\/subfolderstructure/);
                done();
            } catch (e) {
                done(e);
            }
        });

        it('shoud only use forward slashes', async done => {
            try {
                let items = await extension.pickProvider.buildQuickPickList(document, 'SubFileLevel3');
                await extension.addImportToDocument(items[0]);
                document.getText().should.not.match(/\\/);
                done();
            } catch (e) {
                done(e);
            }
        });

        it('shoud use ./ for same directory files', async done => {
            try {
                let items = await extension.pickProvider.buildQuickPickList(document, 'AddImportSameDirectory');
                await extension.addImportToDocument(items[0]);
                document.getText().should.match(/\.\/sameDirectory/);
                done();
            } catch (e) {
                done(e);
            }
        });

    });

    describe('organizeImports', () => {

        it('shoud remove unused imports');

        it('shoud order string imports to the top');

        it('shoud order libraries by name');

        it('shoud order specifiers by name');

    });

});
