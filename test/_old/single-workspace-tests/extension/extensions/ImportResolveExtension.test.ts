import * as chai from 'chai';
import { join } from 'path';
import * as sinon from 'sinon';
import { DeclarationIndex, TypescriptParser } from 'typescript-parser';
import * as vscode from 'vscode';

import { ConfigFactory } from '../../../../src/common/factories';
import { ImportResolveExtension } from '../../../../src/extension/extensions/ImportResolveExtension';
import { Container } from '../../../../src/extension/IoC';
import { iocSymbols } from '../../../../src/extension/IoCSymbols';
import { DeclarationIndexMapper } from '../../../../src/extension/utilities/DeclarationIndexMapper';
import { Logger } from '../../../../src/extension/utilities/winstonLogger';

chai.should();


describe('TypeScript Mode: ImportResolveExtension', () => {

    const rootPath = vscode.workspace.workspaceFolders![0].uri.fsPath;
    let extension: any;

    before(async () => {
        const file = join(
            rootPath,
            'extension/extensions/importResolveExtension/addImportToDocument.ts',
        );
        const document = await vscode.workspace.openTextDocument(file);

        await vscode.window.showTextDocument(document);

        const ctx = Container.get<vscode.ExtensionContext>(iocSymbols.extensionContext);
        const logger = Container.get<Logger>(iocSymbols.logger);
        const config = Container.get<ConfigFactory>(iocSymbols.configuration);
        const parser = Container.get<TypescriptParser>(iocSymbols.typescriptParser);
        const fakeMapper = new DeclarationIndexMapper(logger, ctx, parser, config);

        const index = new DeclarationIndex(parser, rootPath);
        await index.buildIndex(
            [
                join(
                    rootPath,
                    'typings/globals/body-parser/index.d.ts',
                ),
                join(
                    rootPath,
                    'server/indices/MyClass.ts',
                ),
                join(
                    rootPath,
                    'extension/extensions/importResolveExtension/sub1/sub2/sub3/subFile.ts',
                ),
                join(
                    rootPath,
                    'extension/extensions/importResolveExtension/sameDirectory.ts',
                ),
            ],
        );

        fakeMapper.getIndexForFile = sinon.spy(() => index);

        extension = new ImportResolveExtension(ctx, logger, parser, fakeMapper);
    });

    describe('addImportToDocument', () => {
        const file = join(
            rootPath,
            'extension/extensions/importResolveExtension/addImportToDocument.ts',
        );
        let document: vscode.TextDocument;

        before(async () => {
            document = await vscode.workspace.openTextDocument(file);
            await vscode.window.showTextDocument(document);
        });

        afterEach(async () => {
            await vscode.window.activeTextEditor!.edit((builder) => {
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
            document.getText().should.match(/\.\.\/\.\.\/\.\.\/server\/indices/);
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

        const file = join(rootPath, 'extension/extensions/importResolveExtension/organizeImports.ts');
        let document: vscode.TextDocument;
        let documentText: string;

        before(async () => {
            document = await vscode.workspace.openTextDocument(file);
            await vscode.window.showTextDocument(document);
            documentText = document.getText();
        });

        afterEach(async () => {
            await vscode.window.activeTextEditor!.edit((builder) => {
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
            document.lineAt(2).text.should.match(/resourceIndex/);
            document.lineAt(3).text.should.match(/subfolderstructure/);
        });

        it('shoud order specifiers by name', async () => {
            await extension.organizeImports();
            document.lineAt(2).text.should.match(/ExportAlias.*FancierLibraryClass/);
        });

    });

    describe('organizeImports with exports', () => {

        const file = join(rootPath, 'extension/extensions/importResolveExtension/organizeImportsWithExports.ts');
        let document: vscode.TextDocument;
        let documentText: string;

        before(async () => {
            document = await vscode.workspace.openTextDocument(file);
            await vscode.window.showTextDocument(document);
            documentText = document.getText();
        });

        afterEach(async () => {
            await vscode.window.activeTextEditor!.edit((builder) => {
                builder.delete(new vscode.Range(
                    new vscode.Position(0, 0),
                    document.lineAt(document.lineCount - 1).rangeIncludingLineBreak.end,
                ));
                builder.insert(new vscode.Position(0, 0), documentText);
            });
        });

        it('shoud remove unused imports', async () => {
            await extension.organizeImports();
            document.getText().should.not.match(/notUsed/);
        });

        it('shoud not remove the used import beneath an export', async () => {
            await extension.organizeImports();
            document.lineAt(0).text.should.equal(`import { moduleFunc } from 'SomeModule';`);
        });

    });

});

describe('JavaScript Mode: ImportResolveExtension', () => {

    const rootPath = vscode.workspace.workspaceFolders![0].uri.fsPath;
    let extension: any;

    before(async () => {
        const file = join(
            rootPath,
            'extension/extensions/importResolveExtension/addImportToDocument.js',
        );
        const document = await vscode.workspace.openTextDocument(file);

        await vscode.window.showTextDocument(document);

        const ctx = Container.get<vscode.ExtensionContext>(iocSymbols.extensionContext);
        const logger = Container.get<Logger>(iocSymbols.logger);
        const config = Container.get<ConfigFactory>(iocSymbols.configuration);
        const parser = Container.get<TypescriptParser>(iocSymbols.typescriptParser);
        const fakeMapper = new DeclarationIndexMapper(logger, ctx, parser, config);

        const index = new DeclarationIndex(parser, rootPath);
        await index.buildIndex(
            [
                join(
                    rootPath,
                    'typings/globals/body-parser/index.d.ts',
                ),
                join(
                    rootPath,
                    'extension/extensions/importResolveExtension/jsfile.js',
                ),
                join(
                    rootPath,
                    'extension/extensions/importResolveExtension/jsxfile.jsx',
                ),
            ],
        );

        fakeMapper.getIndexForFile = sinon.spy(() => index);

        extension = new ImportResolveExtension(ctx, logger, parser, fakeMapper);
    });

    describe('addImportToDocument', () => {
        const file = join(
            rootPath,
            'extension/extensions/importResolveExtension/addImportToDocument.js',
        );
        let document: vscode.TextDocument;

        before(async () => {
            document = await vscode.workspace.openTextDocument(file);
            await vscode.window.showTextDocument(document);
        });

        afterEach(async () => {
            await vscode.window.activeTextEditor!.edit((builder) => {
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
                cursorSymbol: 'JSFoobar',
                documentSource: '',
                docuemntPath: document.fileName,
            });
            await extension.addImportToDocument(items[0]);
            document.getText().should.equal(`import { JSFoobar } from './jsfile';\n`);
        });

        it('shoud update a named import correcty', async () => {
            const items = await extension.getDeclarationsForImport({
                cursorSymbol: 'JSX',
                documentSource: '',
                docuemntPath: document.fileName,
            });
            await extension.addImportToDocument(items[0]);
            await extension.addImportToDocument(items[1]);
            document.getText().should.equal(`import { JSXClass, JSXFunction } from './jsxfile';\n`);
        });

    });

});

describe('Mixed Mode: ImportResolveExtension', () => {

    const rootPath = vscode.workspace.workspaceFolders![0].uri.fsPath;
    let extension: any;

    before(async () => {
        const file = join(
            rootPath,
            'extension/extensions/importResolveExtension/addImportToDocument.ts',
        );
        const document = await vscode.workspace.openTextDocument(file);

        await vscode.window.showTextDocument(document);

        const ctx = Container.get<vscode.ExtensionContext>(iocSymbols.extensionContext);
        const logger = Container.get<Logger>(iocSymbols.logger);
        const config = Container.get<ConfigFactory>(iocSymbols.configuration);
        const parser = Container.get<TypescriptParser>(iocSymbols.typescriptParser);
        const fakeMapper = new DeclarationIndexMapper(logger, ctx, parser, config);

        const index = new DeclarationIndex(parser, rootPath);
        await index.buildIndex(
            [
                join(
                    rootPath,
                    'typings/globals/body-parser/index.d.ts',
                ),
                join(
                    rootPath,
                    'extension/extensions/importResolveExtension/jsfile.js',
                ),
                join(
                    rootPath,
                    'extension/extensions/importResolveExtension/jsxfile.jsx',
                ),
                join(
                    rootPath,
                    'extension/extensions/importResolveExtension/sameDirectory.ts',
                ),
            ],
        );

        fakeMapper.getIndexForFile = sinon.spy(() => index);

        extension = new ImportResolveExtension(ctx, logger, parser, fakeMapper);
    });

    describe('addImportToDocument in .js file', () => {
        const file = join(
            rootPath,
            'extension/extensions/importResolveExtension/addImportToDocument.js',
        );
        let document: vscode.TextDocument;

        before(async () => {
            document = await vscode.workspace.openTextDocument(file);
            await vscode.window.showTextDocument(document);
        });

        afterEach(async () => {
            await vscode.window.activeTextEditor!.edit((builder) => {
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

        it('shoud write a named import correctly (JS)', async () => {
            const items = await extension.getDeclarationsForImport({
                cursorSymbol: 'JSFoobar',
                documentSource: '',
                docuemntPath: document.fileName,
            });
            await extension.addImportToDocument(items[0]);
            document.getText().should.equal(`import { JSFoobar } from './jsfile';\n`);
        });

        it('shoud write a named import correctly (TS)', async () => {
            const items = await extension.getDeclarationsForImport({
                cursorSymbol: 'AddImportSameDirectory',
                documentSource: '',
                docuemntPath: document.fileName,
            });
            await extension.addImportToDocument(items[0]);
            document.getText().should.equal(`import { AddImportSameDirectory } from './sameDirectory';\n`);
        });

    });

    describe('addImportToDocument in .ts file', () => {
        const file = join(
            rootPath,
            'extension/extensions/importResolveExtension/addImportToDocument.ts',
        );
        let document: vscode.TextDocument;

        before(async () => {
            document = await vscode.workspace.openTextDocument(file);
            await vscode.window.showTextDocument(document);
        });

        afterEach(async () => {
            await vscode.window.activeTextEditor!.edit((builder) => {
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

        it('shoud write a named import correctly (JS)', async () => {
            const items = await extension.getDeclarationsForImport({
                cursorSymbol: 'JSFoobar',
                documentSource: '',
                docuemntPath: document.fileName,
            });
            await extension.addImportToDocument(items[0]);
            document.getText().should.equal(`import { JSFoobar } from './jsfile';\n`);
        });

        it('shoud write a named import correctly (TS)', async () => {
            const items = await extension.getDeclarationsForImport({
                cursorSymbol: 'AddImportSameDirectory',
                documentSource: '',
                docuemntPath: document.fileName,
            });
            await extension.addImportToDocument(items[0]);
            document.getText().should.equal(`import { AddImportSameDirectory } from './sameDirectory';\n`);
        });

    });

});
