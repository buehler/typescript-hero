import { ResolveIndex } from '../../src/caches/ResolveIndex';
import { CodeFixExtension } from '../../src/extensions/CodeFixExtension';
import { Injector } from '../../src/IoC';
import { CodeAction } from '../../src/models/CodeAction';
import { TypescriptCodeActionProvider } from '../../src/provider/TypescriptCodeActionProvider';
import * as chai from 'chai';
import { join } from 'path';
import * as sinon from 'sinon';
import { Position, Range, TextDocument, window, workspace } from 'vscode';

chai.should();

class SpyCodeAction implements CodeAction {
    constructor(private spy: sinon.SinonSpy, private result: boolean) { }

    public async execute(): Promise<boolean> {
        this.spy();
        return this.result;
    }
}

describe.only('CodeFixExtension', () => {

    let extension: any,
        actionProvider: TypescriptCodeActionProvider;

    before(() => {
        extension = Injector.getAll<CodeFixExtension>('Extension').find(o => o instanceof CodeFixExtension);
        actionProvider = Injector.get<TypescriptCodeActionProvider>(TypescriptCodeActionProvider);
    });

    describe('executeCodeAction', () => {

        const file = join(workspace.rootPath, 'codeFixExtension/empty.ts');
        let document: TextDocument;

        before(async done => {
            document = await workspace.openTextDocument(file);
            await window.showTextDocument(document);
            done();
        });

        afterEach(async done => {
            await window.activeTextEditor.edit(builder => {
                builder.delete(new Range(
                    new Position(0, 0),
                    document.lineAt(document.lineCount - 1).rangeIncludingLineBreak.end
                ));
            });
            done();
        });

        it('should call the execute method of a code action', async done => {
            try {
                let spy = sinon.spy();
                await extension.executeCodeAction(new SpyCodeAction(spy, true));
                spy.should.be.calledOnce;
                done();
            } catch (e) {
                done(e);
            }
        });

        it('should warn the user if the result is false', async done => {
            let stub = sinon.stub(window, 'showWarningMessage', (text) => {
                return Promise.resolve();
            });

            try {
                await extension.executeCodeAction(new SpyCodeAction(sinon.spy(), false));
                stub.should.be.calledWith('The provided code action could not complete. Please see the logs.');
                done();
            } catch (e) {
                done(e);
            } finally {
                stub.restore();
            }
        });

    });

    describe('missingImport', () => {

        const file = join(workspace.rootPath, 'codeFixExtension/empty.ts');
        let document: TextDocument;

        before(async done => {
            document = await workspace.openTextDocument(file);
            await window.showTextDocument(document);
            done();
        });

        afterEach(async done => {
            await window.activeTextEditor.edit(builder => {
                builder.delete(new Range(
                    new Position(0, 0),
                    document.lineAt(document.lineCount - 1).rangeIncludingLineBreak.end
                ));
            });
            done();
        });

        it('should add a missing import to a document', async done => {
            try {
                let cmds = await actionProvider.provideCodeActions(
                    document,
                    new Range(new Position(0, 0), new Position(0, 0)),
                    <any>{ diagnostics: [{ message: `Cannot find name 'Class1'.` }] },
                    null
                );
                await extension.executeCodeAction(cmds[0].arguments[0]);
                document.lineAt(0).text.should.equal(`import { Class1 } from '../resourceIndex';`);
                done();
            } catch (e) {
                done(e);
            }
        });

    });

    describe('missingPolymorphicElements', () => {

        const file = join(workspace.rootPath, 'codeFixExtension/implementInterfaceOrAbstract.ts');
        let document: TextDocument,
            documentText: string;

        before(async done => {
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

        it('should add interface elements to a class');

        it('should add abstract class elements to a class');

        it('should add local interface elements to a class');

        it('should add local abstract class elements to a class');

    });

});
