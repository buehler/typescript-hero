import { CodeFixExtension } from '../../src/extensions/CodeFixExtension';
import { Injector } from '../../src/IoC';
import * as chai from 'chai';
import { join } from 'path';
import * as vscode from 'vscode';

chai.should();

describe('CodeFixExtension', () => {

    let extension: any;

    before(() => {
        extension = Injector.getAll<CodeFixExtension>('Extension').find(o => o instanceof CodeFixExtension);
    });

    describe('executeCodeAction', () => {

        // const file = join(vscode.workspace.rootPath, 'resolveExtension/addImportToDocument.ts');
        // let document: vscode.TextDocument;

        // before(async done => {
        //     document = await vscode.workspace.openTextDocument(file);
        //     await vscode.window.showTextDocument(document);
        //     done();
        // });

        // afterEach(async done => {
        //     await vscode.window.activeTextEditor.edit(builder => {
        //         builder.delete(new vscode.Range(
        //             new vscode.Position(0, 0),
        //             document.lineAt(document.lineCount - 1).rangeIncludingLineBreak.end
        //         ));
        //     });
        //     done();
        // });

        it('should call the execute method of a code action');

        it('should add a missing import to a document');

        it('should warn the user if the result is false');

    });

});
