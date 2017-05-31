import { ExtensionConfig } from '../../../src/common/config';
import { TypescriptParser } from '../../../src/common/ts-parsing';
import { LoggerFactory } from '../../../src/common/utilities';
import { CodeCompletionExtension } from '../../../src/extension/extensions/CodeCompletionExtension';
import { Container } from '../../../src/extension/IoC';
import { iocSymbols } from '../../../src/extension/IoCSymbols';
import { DeclarationIndex } from '../../../src/server/indices/DeclarationIndex';
import * as chai from 'chai';
import { join } from 'path';
import * as vscode from 'vscode';

const should = chai.should();

describe('CodeCompletionExtension', () => {

    const token = new vscode.CancellationTokenSource().token;
    let document: vscode.TextDocument;
    let extension: CodeCompletionExtension;

    before(async () => {
        const file = join(
            vscode.workspace.rootPath,
            'extension/extensions/codeCompletionExtension/codeCompletionFile.ts',
        );
        document = await vscode.workspace.openTextDocument(file);
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
                    'extension/extensions/codeCompletionExtension/codeCompletionImports.ts',
                ),
                join(
                    vscode.workspace.rootPath,
                    'server/indices/MyClass.ts',
                ),
            ],
            vscode.workspace.rootPath,
        );

        extension = new CodeCompletionExtension(ctx, logger, config, parser, index as any);
    });

    it('shoud resolve to null if typing in a string', async () => {
        const result = await extension.provideCompletionItems(document, new vscode.Position(0, 2), token);

        should.not.exist(result);
    });

    it('shoud resolve to null if after a "." (PropertyAccess)', async () => {
        const result = await extension.provideCompletionItems(document, new vscode.Position(1, 9), token);

        should.not.exist(result);
    });

    it('shoud resolve to null if in a comment', async () => {
        const result = await extension.provideCompletionItems(document, new vscode.Position(2, 4), token);

        should.not.exist(result);
    });

    it('shoud resolve to null if writing an import', async () => {
        const result = await extension.provideCompletionItems(document, new vscode.Position(3, 10), token);

        should.not.exist(result);
    });

    it('shoud create a completion list', async () => {
        const result = await extension.provideCompletionItems(document, new vscode.Position(6, 5), token);

        should.exist(result);
        result![0].label.should.equal('MyClass');
        result![0].detail.should.equal('/server/indices/MyClass');
    });

    it('shoud add an insert text edit if import would be new', async () => {
        const result = await extension.provideCompletionItems(document, new vscode.Position(6, 5), token);

        should.exist(result);
        result![0].additionalTextEdits.should.be.an('array').with.lengthOf(1);
        result![0].additionalTextEdits[0].newText.should.equal('import { MyClass } from \'../../../server/indices/MyClass\';\n');
    });

    it('shoud add a replace text edit if import will be updated with new specifier', async () => {
        const result = await extension.provideCompletionItems(document, new vscode.Position(9, 10), token);

        should.exist(result);
        result![0].additionalTextEdits.should.be.an('array').with.lengthOf(1);
        result![0].additionalTextEdits[0].newText.should.equal(
            `import { AlreadyImported, ShouldBeImported } from './codeCompletionImports';\n`,
        );
    });

    it('shoud resolve to no import if import is already imported', async () => {
        const result = await extension.provideCompletionItems(document, new vscode.Position(11, 9), token);

        should.exist(result);
        result!.should.be.an('array').with.lengthOf(0);
    });

    it('shoud not suggeset an item from the own file', async () => {
        const result = await extension.provideCompletionItems(document, new vscode.Position(15, 5), token);

        should.exist(result);
        result!.should.be.an('array').with.lengthOf(0);
    });

});
