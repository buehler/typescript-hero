import { DocumentController } from '../../src/controllers/DocumentController';
import { join } from 'path';
import * as chai from 'chai';
import { Position, Range, TextDocument, window, workspace } from 'vscode';

chai.should();

describe('DocumentController', () => {

    const file = join(workspace.rootPath, 'resolveExtension/organizeImports.ts');
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

    describe('static create()', () => {

        it('should create a document controller', async done => {
            let ctrl = await DocumentController.create(document);
            ctrl.should.be.an.instanceof(DocumentController);
            done();
        });

    });

});
