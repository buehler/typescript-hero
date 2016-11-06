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
                cmds.should.have.lengthOf(1);
                let action = cmds[0];
                action.title.should.equal('Import Class1 to the document.');
                action.arguments[0].should.be.an.instanceof(AddImportCodeAction);
            });

            it('should not resolve to a code action if the missing import is not found in the index', () => {
                let cmds = provider.provideCodeActions(
                    document,
                    new vscode.Range(new vscode.Position(0, 0), new vscode.Position(0, 0)),
                    { diagnostics: [{ message: `Cannot find name 'FOOOOBAR'.` }] },
                    null
                );
                cmds.should.have.lengthOf(0);
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
