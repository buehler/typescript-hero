import { Injector } from '../../src/IoC';
import { ResolveCompletionItemProvider } from '../../src/provider/ResolveCompletionItemProvider';
import * as chai from 'chai';
import { join } from 'path';
import * as vscode from 'vscode';

let should = chai.should();

describe('ResolveCompletionItemProvider', () => {

    let document: vscode.TextDocument,
        provider: ResolveCompletionItemProvider,
        token = new vscode.CancellationTokenSource().token;

    before(async done => {
        provider = Injector.get(ResolveCompletionItemProvider);
        let file = join(vscode.workspace.rootPath, 'completionProvider/codeCompletionFile.ts');
        document = await vscode.workspace.openTextDocument(file);
        await vscode.window.showTextDocument(document);
        done();
    });

    it('shoud resolve to null if typing in a string', async done => {
        let result = await provider.provideCompletionItems(document, new vscode.Position(0, 2), token);
        try {
            should.not.exist(result);
            done();
        } catch (e) {
            done(e);
        }
    });

    it('shoud resolve to null if after a "." (PropertyAccess)', async done => {
        let result = await provider.provideCompletionItems(document, new vscode.Position(1, 9), token);
        try {
            should.not.exist(result);
            done();
        } catch (e) {
            done(e);
        }
    });

    it('shoud resolve to null if in a comment', async done => {
        let result = await provider.provideCompletionItems(document, new vscode.Position(2, 4), token);
        try {
            should.not.exist(result);
            done();
        } catch (e) {
            done(e);
        }
    });

    it('shoud resolve to null if writing an import', async done => {
        let result = await provider.provideCompletionItems(document, new vscode.Position(3, 10), token);
        try {
            should.not.exist(result);
            done();
        } catch (e) {
            done(e);
        }
    });

    it('shoud create a completion list', async done => {
        let result = await provider.provideCompletionItems(document, new vscode.Position(6, 5), token);
        try {
            should.exist(result);
            result[0].label.should.equal('MyClass');
            result[0].detail.should.equal('/resourceIndex');
            done();
        } catch (e) {
            done(e);
        }
    });

    it('shoud add an insert text edit if import would be new', async done => {
        let result = await provider.provideCompletionItems(document, new vscode.Position(6, 5), token);
        try {
            should.exist(result);
            result[0].additionalTextEdits.should.be.an('array').with.lengthOf(1);
            result[0].additionalTextEdits[0].newText.should.equal('import { MyClass } from \'../resourceIndex\';\n');
            done();
        } catch (e) {
            done(e);
        }
    });

    it('shoud add a replace text edit if import will be updated with new specifier', async done => {
        let result = await provider.provideCompletionItems(document, new vscode.Position(9, 10), token);
        try {
            should.exist(result);
            result[0].additionalTextEdits.should.be.an('array').with.lengthOf(1);
            result[0].additionalTextEdits[0].newText.should.equal("import { AlreadyImported, ShouldBeImported } from './codeCompletionImports';\n");
            done();
        } catch (e) {
            done(e);
        }
    });

    it('shoud resolve to no import if import is already imported', async done => {
        let result = await provider.provideCompletionItems(document, new vscode.Position(11, 9), token);
        try {
            should.exist(result);
            result.should.be.an('array').with.lengthOf(0);
            done();
        } catch (e) {
            done(e);
        }
    });

    it('shoud not suggeset an item from the own file', async done => {
        let result = await provider.provideCompletionItems(document, new vscode.Position(15, 5), token);
        try {
            should.exist(result);
            result.should.be.an('array').with.lengthOf(0);
            done();
        } catch (e) {
            done(e);
        }
    });

});
