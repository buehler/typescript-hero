import { ExtensionConfig } from '../../../src/common/config';
import { ImportLocation } from '../../../src/common/ts-generation';
import { TypescriptParser } from '../../../src/common/ts-parsing';
import { LoggerFactory } from '../../../src/common/utilities';
import { ImportResolveExtension } from '../../../src/extension/extensions/ImportResolveExtension';
import { Container } from '../../../src/extension/IoC';
import { iocSymbols } from '../../../src/extension/IoCSymbols';
import { DeclarationIndex } from '../../../src/server/indices/DeclarationIndex';
import * as chai from 'chai';
import { join } from 'path';
import * as vscode from 'vscode';

chai.should();

describe('ImportResolveExtension', () => {

    let extension: any;
    let previousConfig: ExtensionConfig;
    const defaultConfig: ExtensionConfig = {
        resolver: {
            disableImportSorting: false,
            generationOptions: {
                eol: ';',
                multiLineWrapThreshold: 120,
                spaceBraces: true,
                stringQuoteStyle: `'`,
                tabSize: 4,
            },
            ignorePatterns: [],
            stringQuoteStyle: `'`,
            insertSemicolons: true,
            insertSpaceBeforeAndAfterImportBraces: true,
            multiLineWrapThreshold: 120,
            newImportLocation: ImportLocation.TopOfFile,
            tabSize: 4,
        },
        verbosity: 'Warning',
        sort: {
            type: 'ascending',
            semantic: [],
        },
    };

    before(async () => {
        previousConfig = Container.get<ExtensionConfig>(iocSymbols.configuration);
        Container.rebind<ExtensionConfig>(iocSymbols.configuration).toConstantValue(defaultConfig);
        
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

    after(() => {
        Container.rebind<ExtensionConfig>(iocSymbols.configuration).toConstantValue(previousConfig);
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

        describe('when sort order is semantic', () => {
            before(() => {
                defaultConfig.sort.type = 'semantic';
                defaultConfig.sort.semantic = ['plains', 'globals', 'locals'];
            });

            beforeEach(async () => {
                await extension.organizeImports();
            });

            it('should remove unused imports', () => {
                document.getText().should.not.match(/Class1/);
            });

            it('should order string imports to the top', () => {
                document.lineAt(0).text.should.equal(`import 'foo-bar';`);
            });

            it('should order global imports alphabetically after string imports', () => {
                document.lineAt(1).text.should.equal(`import { Input } from '@angular/core';`);
                document.lineAt(2).text.should.equal(`import * as React from 'react';`);
            });

            it('should order imports from your code by name and put them last', () => {
                document.lineAt(3).text.should.match(/resourceIndex/);
                document.lineAt(4).text.should.match(/subfolderstructure/);
            });

            it('should order specifiers by name', () => {
                document.lineAt(3).text.should.match(/ExportAlias.*FancierLibraryClass/);
            });
        });

        describe('when sort order is ascending', () => {
            before(() => {
                defaultConfig.sort.type = 'ascending';
            });

            beforeEach(async () => {
                await extension.organizeImports();
            });

            it('should order imports alphabetically by name', () => {
                document.lineAt(0).text.should.match(/resourceIndex/);
                document.lineAt(1).text.should.match(/subfolderstructure/);
                document.lineAt(2).text.should.equal(`import { Input } from '@angular/core';`);
                document.lineAt(3).text.should.equal(`import 'foo-bar';`);
                document.lineAt(4).text.should.equal(`import * as React from 'react';`);
            });

            it('should order specifiers by name', () => {
                document.lineAt(0).text.should.match(/ExportAlias.*FancierLibraryClass/);
            });
        });

        describe('when sort order is descending', () => {
            before(() => {
                defaultConfig.sort.type = 'descending';
            });

            beforeEach(async () => {
                await extension.organizeImports();
            });

            it('should order imports alphabetically by name', () => {
                document.lineAt(4).text.should.match(/resourceIndex/);
                document.lineAt(3).text.should.match(/subfolderstructure/);
                document.lineAt(2).text.should.equal(`import { Input } from '@angular/core';`);
                document.lineAt(1).text.should.equal(`import 'foo-bar';`);
                document.lineAt(0).text.should.equal(`import * as React from 'react';`);
            });

            it('should order specifiers by name', () => {
                document.lineAt(4).text.should.match(/ExportAlias.*FancierLibraryClass/);
            });
        });
    });

});
