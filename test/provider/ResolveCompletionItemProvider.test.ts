import {Injector} from '../../src/IoC';
import {ResolveCompletionItemProvider} from '../../src/provider/ResolveCompletionItemProvider';
import * as chai from 'chai';
import {join} from 'path';
import * as vscode from 'vscode';

let should = chai.should();

describe('ResolveCompletionItemProvider', () => {

    let document: vscode.TextDocument,
        provider: ResolveCompletionItemProvider,
        token = new vscode.CancellationTokenSource().token;

    before(() => {
        provider = Injector.get(ResolveCompletionItemProvider);
        let file = join(process.cwd(), '.test/completionProvider/codeCompletionFile.ts');
        return vscode.workspace
            .openTextDocument(file)
            .then(doc => document = doc);
    });

    it('shoud resolve to null if typing in a string', done => {
        provider
            .provideCompletionItems(document, new vscode.Position(0, 2), token)
            .then(result => {
                try {
                    should.not.exist(result);
                    done();
                } catch (e) {
                    done(e);
                }
            })
            .catch(done);
    });

    it('shoud resolve to null if after a "." (PropertyAccess)', done => {
        provider
            .provideCompletionItems(document, new vscode.Position(1, 9), token)
            .then(result => {
                try {
                    should.not.exist(result);
                    done();
                } catch (e) {
                    done(e);
                }
            })
            .catch(done);
    });

    it('shoud resolve to null if in a comment', done => {
        provider
            .provideCompletionItems(document, new vscode.Position(2, 4), token)
            .then(result => {
                try {
                    should.not.exist(result);
                    done();
                } catch (e) {
                    done(e);
                }
            })
            .catch(done);
    });

    it('shoud resolve to null if writing an import', done => {
        provider
            .provideCompletionItems(document, new vscode.Position(3, 10), token)
            .then(result => {
                try {
                    should.not.exist(result);
                    done();
                } catch (e) {
                    done(e);
                }
            })
            .catch(done);
    });

    it('shoud create a completion list', done => {
        provider
            .provideCompletionItems(document, new vscode.Position(6, 4), token)
            .then(result => {
                try {
                    should.exist(result);
                    result[0].label.should.equal('MyClass');
                    result[0].detail.should.equal('/resourceIndex');
                    done();
                } catch (e) {
                    done(e);
                }
            })
            .catch(done);
    });

    it('shoud add an insert text edit if import would be new', done => {
        provider
            .provideCompletionItems(document, new vscode.Position(6, 4), token)
            .then(result => {
                try {
                    should.exist(result);
                    result[0].additionalTextEdits.should.be.an('array').with.lengthOf(1);
                    result[0].additionalTextEdits[0].newText.should.equal('import {MyClass} from \'../resourceIndex\';\n');
                    done();
                } catch (e) {
                    done(e);
                }
            })
            .catch(done);
    });

    it('shoud add a replace text edit if import will be updated with new specifier', done => {
        provider
            .provideCompletionItems(document, new vscode.Position(9, 10), token)
            .then(result => {
                try {
                    should.exist(result);
                    result[0].additionalTextEdits.should.be.an('array').with.lengthOf(1);
                    result[0].additionalTextEdits[0].newText.should.equal("import {AlreadyImported, ShouldBeImported} from './codeCompletionImports';\n");
                    done();
                } catch (e) {
                    done(e);
                }
            })
            .catch(done);
    });

    it('shoud resolve to no import if import is already imported', done => {
        provider
            .provideCompletionItems(document, new vscode.Position(11, 9), token)
            .then(result => {
                try {
                    should.exist(result);
                    result.should.be.an('array').with.lengthOf(0);
                    done();
                } catch (e) {
                    done(e);
                }
            })
            .catch(done);
    });

    it('shoud suggeset an item from the own file', done => {
        provider
            .provideCompletionItems(document, new vscode.Position(15, 5), token)
            .then(result => {
                try {
                    should.exist(result);
                    result.should.be.an('array').with.lengthOf(0);
                    done();
                } catch (e) {
                    done(e);
                }
            })
            .catch(done);
    });

});
