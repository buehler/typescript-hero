import { TypescriptParser } from '../../../src/common/ts-parsing';
import { DeclarationIndex } from '../../../src/server/indices/DeclarationIndex';
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
            'extension/extensions/importResolveExtension/addImportToDocument.ts',
        );
        const document = await vscode.workspace.openTextDocument(file);

        await vscode.window.showTextDocument(document);

        const ctx = Container.get<vscode.ExtensionContext>(iocSymbols.extensionContext);
        const logger = Container.get<LoggerFactory>(iocSymbols.loggerFactory);
        const config = Container.get<ExtensionConfig>(iocSymbols.configuration);
        const parser = Container.get(TypescriptParser);

        const index = new DeclarationIndex(logger, parser);
        await index.buildIndex(
            [
                join(
                    vscode.workspace.rootPath,
                    'typings/globals/body-parser/index.d.ts',
                ),
                join(
                    vscode.workspace.rootPath,
                    'server/indices/MyClass.ts',
                ),
                join(
                    vscode.workspace.rootPath,
                    'extension/extensions/importResolveExtension/sub1/sub2/sub3/subFile.ts',
                ),
                join(
                    vscode.workspace.rootPath,
                    'extension/extensions/importResolveExtension/sameDirectory.ts',
                ),
            ],
            vscode.workspace.rootPath,
        );

        extension = new ImportResolveExtension(ctx, logger, config, index as any, parser, <any>null);
    });

    describe('addImportToDocument', () => {

        const file = join(
            vscode.workspace.rootPath,
            'extension/extensions/importResolveExtension/addImportToDocument.ts',
        );
        let document: vscode.TextDocument;

        before(async () => {
            document = await vscode.workspace.openTextDocument(file);
            await vscode.window.showTextDocument(document);
        });

        afterEach(async () => {
            await vscode.window.activeTextEditor.edit((builder) => {
                builder.delete(new vscode.Range(
                    new vscode.Position(0, 0),
                    document.lineAt(document.lineCount - 1).rangeIncludingLineBreak.end,
                ));
            });
        });

        it('shoud write a module / namespace import correctly', async () => {
            const items = await extension.getDeclarationsForImport({
                cursorSymbol: 'bodyParser',
                documentSource: '', 
                docuemntPath: document.fileName,
            });
            await extension.addImportToDocument(items[0]);
            document.getText().should.equal(`import * as bodyParser from 'body-parser';\n`);
        });

        it('shoud write a named import correctly', async () => {
            const items = await extension.getDeclarationsForImport({
                cursorSymbol: 'Class1',
                documentSource: '', 
                docuemntPath: document.fileName,
            });
            await extension.addImportToDocument(items[0]);
            document.getText().should.equal(`import { Class1 } from '../../../server/indices/MyClass';\n`);
        });

        it('shoud update a named import correcty', async () => {
            const items = await extension.getDeclarationsForImport({
                cursorSymbol: 'Class',
                documentSource: '', 
                docuemntPath: document.fileName,
            });
            await extension.addImportToDocument(items[0]);
            await extension.addImportToDocument(items[1]);
            document.getText().should.equal(`import { Class1, Class2 } from '../../../server/indices/MyClass';\n`);
        });

        it('shoud use the correct relative path', async () => {
            const items = await extension.getDeclarationsForImport({
                cursorSymbol: 'Class1',
                documentSource: '', 
                docuemntPath: document.fileName,
            });
            await extension.addImportToDocument(items[0]);
            document.getText().should.match(/\.\.\/\.\.\/\.\.\/server\//);
        });

        it('shoud only use forward slashes', async () => {
            const items = await extension.getDeclarationsForImport({
                cursorSymbol: 'SubFileLevel3',
                documentSource: '', 
                docuemntPath: document.fileName,
            });
            await extension.addImportToDocument(items[0]);
            document.getText().should.not.match(/\\/);
        });

        it('shoud use ./ for same directory files', async () => {
            const items = await extension.getDeclarationsForImport({
                cursorSymbol: 'AddImportSameDirectory',
                documentSource: '', 
                docuemntPath: document.fileName,
            });
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
            await vscode.window.activeTextEditor.edit((builder) => {
                builder.delete(new vscode.Range(
                    new vscode.Position(0, 0),
                    document.lineAt(document.lineCount - 1).rangeIncludingLineBreak.end,
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
