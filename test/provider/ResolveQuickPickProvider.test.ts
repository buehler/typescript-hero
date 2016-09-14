import {ResolveQuickPickItem} from '../../src/models/QuickPickItems';
import {Injector} from '../../src/IoC';
import {ResolveQuickPickProvider} from '../../src/provider/ResolveQuickPickProvider';
import * as chai from 'chai';
import {join} from 'path';
import * as vscode from 'vscode';

chai.should();

type ProviderMock = ResolveQuickPickProvider & { buildQuickPickList: (activeDocument: vscode.TextDocument, cursorSymbol?: string) => Promise<ResolveQuickPickItem[]> }

describe('ResolveQuickPickProvider', () => {

    let provider: ProviderMock;

    before(() => {
        provider = Injector.get(ResolveQuickPickProvider) as ProviderMock;
    });

    describe('addImport', () => {

        it('shoud show all possible declarations', done => {
            let file = join(process.cwd(), '.test/foobar.ts');
            vscode.workspace
                .openTextDocument(file)
                .then(openDocument => provider.buildQuickPickList(openDocument))
                .then(items => {
                    try {
                        items.should.be.an('array').with.length.of.at.least(5);
                        ['ExportAlias', 'MyClass', 'isString', 'FancyLibraryClass', 'raw'].every(label => items.some(item => item.label === label)).should.be.true;
                        done();
                    } catch (e) {
                        done(e);
                    }
                });
        });

        it('shoud order own files before typings / node modules', done => {
            let file = join(process.cwd(), '.test/foobar.ts');
            vscode.workspace
                .openTextDocument(file)
                .then(openDocument => provider.buildQuickPickList(openDocument))
                .then(items => {
                    try {
                        for (let x = 0; x < 5; x++) {
                            items[x].description.indexOf('resourceIndex').should.not.equal(-1);
                        }
                        done();
                    } catch (e) {
                        done(e);
                    }
                });
        });

        it('shoud order the declarations by name', done => {
            let file = join(process.cwd(), '.test/foobar.ts');
            vscode.workspace
                .openTextDocument(file)
                .then(openDocument => provider.buildQuickPickList(openDocument))
                .then(items => {
                    try {
                        (items[0].label < items[1].label).should.be.true;
                        (items[1].label < items[2].label).should.be.true;

                        (items[6].label < items[7].label).should.be.true;
                        (items[7].label < items[8].label).should.be.true;
                        done();
                    } catch (e) {
                        done(e);
                    }
                });
        });

        it('shoud filter already imported named symbols', done => {
            let file = join(process.cwd(), '.test/quickPickProvider/alreadyNamedImport.ts');
            vscode.workspace
                .openTextDocument(file)
                .then(openDocument => provider.buildQuickPickList(openDocument))
                .then(items => {
                    try {
                        (items.some(o => o.label === 'MyClass')).should.be.false;
                        done();
                    } catch (e) {
                        done(e);
                    }
                });
        });

        it('shoud filter already imported modules / namespaces', done => {
            let file = join(process.cwd(), '.test/quickPickProvider/alreadyNamespaceImport.ts');
            vscode.workspace
                .openTextDocument(file)
                .then(openDocument => provider.buildQuickPickList(openDocument))
                .then(items => {
                    try {
                        (items.some(o => o.label === 'raw')).should.be.false;
                        (items.some(o => o.label === 'json')).should.be.false;
                        (items.some(o => o.label === 'text')).should.be.false;
                        (items.some(o => o.label === 'urlencoded')).should.be.false;
                        done();
                    } catch (e) {
                        done(e);
                    }
                });
        });

        it('shoud filter already imported external module reference', done => {
            let file = join(process.cwd(), '.test/quickPickProvider/alreadyExternalModuleImport.ts');
            vscode.workspace
                .openTextDocument(file)
                .then(openDocument => provider.buildQuickPickList(openDocument))
                .then(items => {
                    try {
                        (items.some(o => o.label === 'raw')).should.be.false;
                        (items.some(o => o.label === 'json')).should.be.false;
                        (items.some(o => o.label === 'text')).should.be.false;
                        (items.some(o => o.label === 'urlencoded')).should.be.false;
                        done();
                    } catch (e) {
                        done(e);
                    }
                });
        });

        it('shoud filter already imported default imports');

    });

    describe('addImportUnderCursor', () => {

        it('shoud resolve to 0 items for non found symbol');

        it('shoud find a declaration for a symbol');

        it('shoud possibly find multiple declarations for a symbol');

    });

});
