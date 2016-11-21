import { ClassDeclaration } from '../../src/models/TsDeclaration';
import { ClassManager } from '../../src/managers/ClassManager';
import { ResolveIndex } from '../../src/caches/ResolveIndex';
import { Injector } from '../../src/IoC';
import * as chai from 'chai';
import { join } from 'path';
import sinonChai = require('sinon-chai');
import { Position, Range, TextDocument, window, workspace } from 'vscode';

let should = chai.should();
chai.use(sinonChai);

describe.only('ClassManager', () => {

    const file = join(workspace.rootPath, 'managers/ClassManagerFile.ts');
    let document: TextDocument,
        documentText: string;

    before(async done => {
        let index = Injector.get(ResolveIndex);
        await index.buildIndex();
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

        it('should create an instance of a class manager', async done => {
            try {
                let ctrl = await ClassManager.create(document, 'ManagedClass');
                ctrl.should.be.an.instanceof(ClassManager);

                done();
            } catch (e) {
                done(e);
            }
        });

        it('should select the correct class that should be managed', async done => {
            try {
                let ctrl = await ClassManager.create(document, 'ManagedClass');
                let declaration = (ctrl as any).managedClass as ClassDeclaration;

                should.exist(declaration);
                declaration.name.should.equal('ManagedClass');
                declaration.should.be.an.instanceof(ClassDeclaration);

                done();
            } catch (e) {
                done(e);
            }
        });

        it('should throw when a class is not found', done => {
            let fn = async () => {
                let ctrl = await ClassManager.create(document, 'NonExistingClass');
                return ctrl;
            };

            fn()
                .then(() => done(new Error('did not throw.')))
                .catch(() => done());
        });

    });

});
