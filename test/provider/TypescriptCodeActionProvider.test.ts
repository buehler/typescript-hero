import { Injector } from '../../src/IoC';
import { AddImportCodeAction, CodeAction, ImplementPolymorphElements } from '../../src/models/CodeAction';
import { TypescriptCodeActionProvider } from '../../src/provider/TypescriptCodeActionProvider';
import * as chai from 'chai';
import { join } from 'path';
import { TextDocument } from 'vscode';
import * as vscode from 'vscode';

chai.should();

class NoopCodeAction implements CodeAction {
    public async execute(): Promise<boolean> {
        return true;
    }
}

describe('TypescriptCodeActionProvider', () => {

    const file = join(vscode.workspace.rootPath, 'codeFixExtension/empty.ts');
    let provider: any,
        document: TextDocument;

    before(async done => {
        provider = Injector.get(TypescriptCodeActionProvider);
        document = await vscode.workspace.openTextDocument(file);
        await vscode.window.showTextDocument(document);
        done();
    });

    describe('provideCodeActions()', () => {

        it('should not resolve to a code action if the problem is not recognized', async done => {
            try {
                let cmds = await provider.provideCodeActions(
                    document,
                    new vscode.Range(new vscode.Position(0, 0), new vscode.Position(0, 0)),
                    { diagnostics: [{ message: `I really do have a problem mate..` }] },
                    null
                );
                cmds.should.have.lengthOf(0);
                done();
            } catch (e) {
                done(e);
            }
        });

        describe('missing import actions', () => {

            it('should resolve a missing import problem to a code action', async done => {
                try {
                    let cmds = await provider.provideCodeActions(
                        document,
                        new vscode.Range(new vscode.Position(0, 0), new vscode.Position(0, 0)),
                        { diagnostics: [{ message: `Cannot find name 'Class1'.` }] },
                        null
                    );
                    cmds.should.have.lengthOf(2);
                    let action = cmds[0];
                    action.title.should.equal('Import "Class1" from "/resourceIndex".');
                    action.arguments[0].should.be.an.instanceof(AddImportCodeAction);
                    done();
                } catch (e) {
                    done(e);
                }
            });

            it('should resolve to a NOOP code action if the missing import is not found in the index', async done => {
                try {
                    let cmds = await provider.provideCodeActions(
                        document,
                        new vscode.Range(new vscode.Position(0, 0), new vscode.Position(0, 0)),
                        { diagnostics: [{ message: `Cannot find name 'FOOOOBAR'.` }] },
                        null
                    );
                    cmds.should.have.lengthOf(1);
                    cmds[0].title.should.equal('Cannot find "FOOOOBAR" in the index.');
                    done();
                } catch (e) {
                    done(e);
                }
            });

            it('should add multiple code actions for multiple declarations found', async done => {
                try {
                    let cmds = await provider.provideCodeActions(
                        document,
                        new vscode.Range(new vscode.Position(0, 0), new vscode.Position(0, 0)),
                        { diagnostics: [{ message: `Cannot find name 'FancierLibraryClass'.` }] },
                        null
                    );
                    cmds.should.have.lengthOf(3);
                    let action = cmds[0];
                    action.title.should.equal('Import "FancierLibraryClass" from "/resourceIndex".');
                    action.arguments[0].should.be.an.instanceof(AddImportCodeAction);

                    action = cmds[1];
                    action.title.should.equal('Import "FancierLibraryClass" from "fancy-library/FancierLibraryClass".');
                    action.arguments[0].should.be.an.instanceof(AddImportCodeAction);
                    done();
                } catch (e) {
                    done(e);
                }
            });

        });

    });

    describe('missing polymorphic elements actions', () => {

        const implFile = join(vscode.workspace.rootPath, 'codeFixExtension/implementInterfaceOrAbstract.ts');

        before(async done => {
            document = await vscode.workspace.openTextDocument(implFile);
            await vscode.window.showTextDocument(document);
            done();
        });

        it('should resolve missing implementations of an interface to a code action', async done => {
            try {
                let cmds = await provider.provideCodeActions(
                    document,
                    new vscode.Range(new vscode.Position(0, 0), new vscode.Position(0, 0)),
                    { diagnostics: [{ message: `class 'Foobar' incorrectly implements 'CodeFixImplementInterface'.` }] },
                    null
                );
                cmds.should.have.lengthOf(1);
                let action = cmds[0];
                action.title.should.equal('Implement missing elements from "CodeFixImplementInterface".');
                action.arguments[0].should.be.an.instanceof(ImplementPolymorphElements);
                done();
            } catch (e) {
                done(e);
            }
        });

        it('should resolve missing implementations of an abstract class to a code action', async done => {
            try {
                let cmds = await provider.provideCodeActions(
                    document,
                    new vscode.Range(new vscode.Position(0, 0), new vscode.Position(0, 0)),
                    { diagnostics: [{ message: `non-abstract class 'Foobar' implement inherited from class 'CodeFixImplementAbstract'.` }] },
                    null
                );
                cmds.should.have.lengthOf(1);
                let action = cmds[0];
                action.title.should.equal('Implement missing elements from "CodeFixImplementAbstract".');
                action.arguments[0].should.be.an.instanceof(ImplementPolymorphElements);
                done();
            } catch (e) {
                done(e);
            }
        });

        it('should resolve missing implementations of a local interface to a code action', async done => {
            try {
                let cmds = await provider.provideCodeActions(
                    document,
                    new vscode.Range(new vscode.Position(0, 0), new vscode.Position(0, 0)),
                    { diagnostics: [{ message: `class 'Foobar' incorrectly implements 'InternalInterface'.` }] },
                    null
                );
                cmds.should.have.lengthOf(1);
                let action = cmds[0];
                action.title.should.equal('Implement missing elements from "InternalInterface".');
                action.arguments[0].should.be.an.instanceof(ImplementPolymorphElements);
                done();
            } catch (e) {
                done(e);
            }
        });

        it('should resolve missing implementations of a local abstract class to a code action', async done => {
            try {
                let cmds = await provider.provideCodeActions(
                    document,
                    new vscode.Range(new vscode.Position(0, 0), new vscode.Position(0, 0)),
                    { diagnostics: [{ message: `non-abstract class 'Foobar' implement inherited from class 'InternalAbstract'.` }] },
                    null
                );
                cmds.should.have.lengthOf(1);
                let action = cmds[0];
                action.title.should.equal('Implement missing elements from "InternalAbstract".');
                action.arguments[0].should.be.an.instanceof(ImplementPolymorphElements);
                done();
            } catch (e) {
                done(e);
            }
        });

        it('should resolve missing to a NOOP if the interface / class is not found', async done => {
            try {
                let cmds = await provider.provideCodeActions(
                    document,
                    new vscode.Range(new vscode.Position(0, 0), new vscode.Position(0, 0)),
                    { diagnostics: [{ message: `non-abstract class 'Foobar' implement inherited from class 'FOOOOBAR'.` }] },
                    null
                );
                cmds.should.have.lengthOf(1);
                cmds[0].title.should.equal('Cannot find "FOOOOBAR" in the index or the actual file.');
                done();
            } catch (e) {
                done(e);
            }
        });

    });

    describe('createCommand()', () => {

        it('should create a command with the corresponding vscode command', () => {
            let cmd = provider.createCommand('TITLE', new NoopCodeAction());
            cmd.command.should.equal('typescriptHero.codeFix.executeCodeAction');
        });

        it('should create a command with the correct code action and title', () => {
            let cmd = provider.createCommand('TITLE', new NoopCodeAction());
            cmd.title.should.equal('TITLE');
        });

    });

});
