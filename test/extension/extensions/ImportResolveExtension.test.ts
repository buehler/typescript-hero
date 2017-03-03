import { ExtensionConfig } from '../../../src/common/config';
import { LoggerFactory } from '../../../src/common/utilities';
import { ImportResolveExtension } from '../../../src/extension/extensions/ImportResolveExtension';
import { Container } from '../../../src/extension/IoC';
import { iocSymbols } from '../../../src/extension/IoCSymbols';
import * as chai from 'chai';
import { join } from 'path';
import * as vscode from 'vscode';

chai.should();

describe('ImportResolveExtension', () => {

    let extension: any;

    before(async done => {
        const file = join(
            vscode.workspace.rootPath,
            'extension/extensions/ImportResolveExtension/addImportToDocument.ts'
        ),
            document = await vscode.workspace.openTextDocument(file);
        await vscode.window.showTextDocument(document);

        const ctx = Container.get<vscode.ExtensionContext>(iocSymbols.extensionContext),
            logger = Container.get<LoggerFactory>(iocSymbols.loggerFactory),
            config = Container.get<ExtensionConfig>(iocSymbols.configuration);

        extension = new ImportResolveExtension(ctx, logger, config, <any>null);

        done();
    });

    describe.skip('addImportToDocument', () => {

        const file = join(
            vscode.workspace.rootPath,
            'extension/extensions/ImportResolveExtension/addImportToDocument.ts'
        );
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

        const file = join(vscode.workspace.rootPath, 'extension/extensions/ImportResolveExtension/organizeImports.ts');
        let document: vscode.TextDocument;
        let documentText: string;

        before(async done => {
            document = await vscode.workspace.openTextDocument(file);
            await vscode.window.showTextDocument(document);
            documentText = document.getText();
            done();
        });

        afterEach(async done => {
            await vscode.window.activeTextEditor.edit(builder => {
                builder.delete(new vscode.Range(
                    new vscode.Position(0, 0),
                    document.lineAt(document.lineCount - 1).rangeIncludingLineBreak.end
                ));
                builder.insert(new vscode.Position(0, 0), documentText);
            });
            done();
        });

        it('shoud remove unused imports', async done => {
            try {
                await extension.organizeImports();
                document.getText().should.not.match(/Class1/);
                done();
            } catch (e) {
                done(e);
            }
        });

        it('shoud order string imports to the top', async done => {
            try {
                await extension.organizeImports();
                document.lineAt(0).text.should.equal(`import 'foo-bar';`);
                done();
            } catch (e) {
                done(e);
            }
        });

        it('shoud order libraries by name', async done => {
            try {
                await extension.organizeImports();
                document.lineAt(1).text.should.match(/resourceIndex/);
                document.lineAt(2).text.should.match(/subfolderstructure/);
                done();
            } catch (e) {
                done(e);
            }
        });

        it('shoud order specifiers by name', async done => {
            try {
                await extension.organizeImports();
                document.lineAt(1).text.should.match(/ExportAlias.*FancierLibraryClass/);
                done();
            } catch (e) {
                done(e);
            }
        });

    });

});
