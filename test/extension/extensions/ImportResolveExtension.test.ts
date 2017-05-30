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

    before(async () => {
        const file = join(
            vscode.workspace.rootPath,
            'extension/extensions/importResolveExtension/addImportToDocument.ts'
        ),
            document = await vscode.workspace.openTextDocument(file);
        await vscode.window.showTextDocument(document);

        const ctx = Container.get<vscode.ExtensionContext>(iocSymbols.extensionContext),
            logger = Container.get<LoggerFactory>(iocSymbols.loggerFactory),
            config = Container.get<ExtensionConfig>(iocSymbols.configuration);

        extension = new ImportResolveExtension(ctx, logger, config, <any>null, <any>null, <any>null);
    });

    describe.skip('addImportToDocument', () => {

        const file = join(
            vscode.workspace.rootPath,
            'extension/extensions/importResolveExtension/addImportToDocument.ts'
        );
        let document: vscode.TextDocument;

        before(async () => {
            document = await vscode.workspace.openTextDocument(file);
            await vscode.window.showTextDocument(document);
        });

        afterEach(async () => {
            await vscode.window.activeTextEditor.edit(builder => {
                builder.delete(new vscode.Range(
                    new vscode.Position(0, 0),
                    document.lineAt(document.lineCount - 1).rangeIncludingLineBreak.end
                ));
            });
        });

        it('shoud write a module / namespace import correctly', async () => {
            let items = await extension.pickProvider.buildQuickPickList(document, 'bodyParser');
            await extension.addImportToDocument(items[0]);
            document.getText().should.equal(`import * as bodyParser from 'body-parser';\n`);
        });

        it('shoud write a named import correctly', async () => {
            let items = await extension.pickProvider.buildQuickPickList(document, 'Class1');
            await extension.addImportToDocument(items[0]);
            document.getText().should.equal(`import { Class1 } from '../resourceIndex';\n`);
        });

        it('shoud update a named import correcty', async () => {
            let items = await extension.pickProvider.buildQuickPickList(document, 'Class');
            await extension.addImportToDocument(items[0]);
            await extension.addImportToDocument(items[1]);
            document.getText().should.equal(`import { Class1, Class2 } from '../resourceIndex';\n`);
        });

        it('shoud use the correct relative path', async () => {
            let items = await extension.pickProvider.buildQuickPickList(document, 'StructuralSecondParentClass');
            await extension.addImportToDocument(items[0]);
            document.getText().should.match(/\.\.\/subfolderstructure/);
        });

        it('shoud only use forward slashes', async () => {
            let items = await extension.pickProvider.buildQuickPickList(document, 'SubFileLevel3');
            await extension.addImportToDocument(items[0]);
            document.getText().should.not.match(/\\/);
        });

        it('shoud use ./ for same directory files', async () => {
            let items = await extension.pickProvider.buildQuickPickList(document, 'AddImportSameDirectory');
            await extension.addImportToDocument(items[0]);
            document.getText().should.match(/\.\/sameDirectory/);
        });

    });

    describe('organizeImports', () => {

        const file = join(vscode.workspace.rootPath, 'extension/extensions/importResolveExtension/organizeImports.ts');
        let document: vscode.TextDocument;
        let documentText: string;

        before(async () => {
            document = await vscode.workspace.openTextDocument(file);
            await vscode.window.showTextDocument(document);
            documentText = document.getText();
        });

        afterEach(async () => {
            await vscode.window.activeTextEditor.edit(builder => {
                builder.delete(new vscode.Range(
                    new vscode.Position(0, 0),
                    document.lineAt(document.lineCount - 1).rangeIncludingLineBreak.end
                ));
                builder.insert(new vscode.Position(0, 0), documentText);
            });
        });

        it('shoud remove unused imports', async () => {
            await extension.organizeImports();
            document.getText().should.not.match(/Class1/);
        });

        it('shoud order string imports to the top', async () => {
            await extension.organizeImports();
            document.lineAt(0).text.should.equal(`import 'foo-bar';`);
        });

        it('shoud order libraries by name', async () => {
            await extension.organizeImports();
            document.lineAt(1).text.should.match(/resourceIndex/);
            document.lineAt(2).text.should.match(/subfolderstructure/);
        });

        it('shoud order specifiers by name', async () => {
            await extension.organizeImports();
            document.lineAt(1).text.should.match(/ExportAlias.*FancierLibraryClass/);
        });

    });

});
