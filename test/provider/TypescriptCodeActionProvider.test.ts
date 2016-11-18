import { Injector } from '../../src/IoC';
import { AddImportCodeAction, CodeAction } from '../../src/models/CodeAction';
import { TypescriptCodeActionProvider } from '../../src/provider/TypescriptCodeActionProvider';
import * as chai from 'chai';
import { join } from 'path';
import * as vscode from 'vscode';

chai.should();

class NoopCodeAction implements CodeAction {
    public async execute(): Promise<boolean> {
        return true;
    }
}

describe('TypescriptCodeActionProvider', () => {

    let provider: any;

    before(() => {
        provider = Injector.get(TypescriptCodeActionProvider);
    });

    describe('provideCodeActions()', () => {

        describe('missing import actions', () => {

            const file = join(vscode.workspace.rootPath, 'codeFixExtension/empty.ts');
            let document: vscode.TextDocument;

            before(async done => {
                document = await vscode.workspace.openTextDocument(file);
                await vscode.window.showTextDocument(document);
                done();
            });

            it('should resolve a missing import problem to a code action', () => {
                let cmds = provider.provideCodeActions(
                    document,
                    new vscode.Range(new vscode.Position(0, 0), new vscode.Position(0, 0)),
                    { diagnostics: [{ message: `Cannot find name 'Class1'.` }] },
                    null
                );
                cmds.should.have.lengthOf(2);
                let action = cmds[0];
                action.title.should.equal('Import "Class1" from "/resourceIndex".');
                action.arguments[0].should.be.an.instanceof(AddImportCodeAction);
            });

            it('should resolve to a NOOP code action if the missing import is not found in the index', () => {
                let cmds = provider.provideCodeActions(
                    document,
                    new vscode.Range(new vscode.Position(0, 0), new vscode.Position(0, 0)),
                    { diagnostics: [{ message: `Cannot find name 'FOOOOBAR'.` }] },
                    null
                );
                cmds.should.have.lengthOf(1);
                cmds[0].title.should.equal('Cannot find "FOOOOBAR" in the index.');
            });

            it('should not resolve to a code action if the problem is not recognized', () => {
                let cmds = provider.provideCodeActions(
                    document,
                    new vscode.Range(new vscode.Position(0, 0), new vscode.Position(0, 0)),
                    { diagnostics: [{ message: `I really do have a problem mate..` }] },
                    null
                );
                cmds.should.have.lengthOf(0);
            });

            it('should add multiple code actions for multiple declarations found', () => {
                let cmds = provider.provideCodeActions(
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
            });

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
