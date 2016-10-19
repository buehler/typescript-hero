import { Injector } from '../../src/IoC';
import { ResolveQuickPickItem } from '../../src/models/QuickPickItems';
import { ResolveQuickPickProvider } from '../../src/provider/ResolveQuickPickProvider';
import * as chai from 'chai';
import { join } from 'path';
import * as vscode from 'vscode';

chai.should();

type ProviderMock = ResolveQuickPickProvider & { buildQuickPickList: (activeDocument: vscode.TextDocument, cursorSymbol?: string) => Promise<ResolveQuickPickItem[]> }

describe('ResolveQuickPickProvider', () => {

    let provider: ProviderMock;

    before(() => {
        provider = Injector.get(ResolveQuickPickProvider) as ProviderMock;
    });

    describe('addImport', () => {

        it('shoud show all possible declarations', async done => {
            let file = join(vscode.workspace.rootPath, 'foobar.ts');
            try {
                let doc = await vscode.workspace.openTextDocument(file),
                    items = await provider.buildQuickPickList(doc);
                items.should.be.an('array').with.length.of.at.least(5);
                ['ExportAlias', 'MyClass', 'isString', 'FancyLibraryClass', 'raw'].every(label => items.some(item => item.label === label)).should.be.true;
                done();
            } catch (e) {
                done(e);
            }
        });

        it('shoud order own files before typings / node modules', async done => {
            let file = join(vscode.workspace.rootPath, 'foobar.ts');
            try {
                let doc = await vscode.workspace.openTextDocument(file),
                    items = await provider.buildQuickPickList(doc);
                for (let x = 0; x < 5; x++) {
                    items[x].description.startsWith('/').should.be.true;
                }
                done();
            } catch (e) {
                done(e);
            }
        });

        it('shoud order the declarations by name', async done => {
            let file = join(vscode.workspace.rootPath, 'foobar.ts');
            try {
                let doc = await vscode.workspace.openTextDocument(file),
                    items = await provider.buildQuickPickList(doc);
                (items[0].label < items[1].label).should.be.true;
                (items[1].label < items[2].label).should.be.true;

                (items[13].label < items[14].label).should.be.true;
                (items[14].label < items[15].label).should.be.true;
                done();
            } catch (e) {
                done(e);
            }
        });

        it('shoud filter already imported named symbols', async done => {
            let file = join(vscode.workspace.rootPath, 'quickPickProvider/alreadyNamedImport.ts');
            try {
                let doc = await vscode.workspace.openTextDocument(file),
                    items = await provider.buildQuickPickList(doc);
                (items.some(o => o.label === 'MyClass')).should.be.false;
                done();
            } catch (e) {
                done(e);
            }
        });

        it('shoud filter already imported modules / namespaces', async done => {
            let file = join(vscode.workspace.rootPath, 'quickPickProvider/alreadyNamespaceImport.ts');
            try {
                let doc = await vscode.workspace.openTextDocument(file),
                    items = await provider.buildQuickPickList(doc);
                (items.some(o => o.label === 'raw')).should.be.false;
                (items.some(o => o.label === 'json')).should.be.false;
                (items.some(o => o.label === 'text')).should.be.false;
                (items.some(o => o.label === 'urlencoded')).should.be.false;
                done();
            } catch (e) {
                done(e);
            }
        });

        it('shoud filter already imported external module reference', async done => {
            let file = join(vscode.workspace.rootPath, 'quickPickProvider/alreadyExternalModuleImport.ts');
            try {
                let doc = await vscode.workspace.openTextDocument(file),
                    items = await provider.buildQuickPickList(doc);
                (items.some(o => o.label === 'raw')).should.be.false;
                (items.some(o => o.label === 'json')).should.be.false;
                (items.some(o => o.label === 'text')).should.be.false;
                (items.some(o => o.label === 'urlencoded')).should.be.false;
                done();
            } catch (e) {
                done(e);
            }
        });

        it('shoud filter already imported default imports', async done => {
            let file = join(vscode.workspace.rootPath, 'defaultExport/codefile.ts');
            try {
                let doc = await vscode.workspace.openTextDocument(file),
                    items = await provider.buildQuickPickList(doc);
                (items.some(o => o.label === 'myDefaultExportedFunction')).should.be.false;
                done();
            } catch (e) {
                done(e);
            }
        });

    });

    describe('addImportUnderCursor', () => {

        const file = join(vscode.workspace.rootPath, 'quickPickProvider/importUnderTheCursor.ts');
        let document: vscode.TextDocument;

        before(async done => {
            document = await vscode.workspace.openTextDocument(file);
            done();
        });

        it('shoud resolve to 0 items for non found symbol', async done => {
            try {
                let items = await provider.buildQuickPickList(document, 'Fooo');
                items.should.be.an('array').with.lengthOf(0);
                done();
            } catch (e) {
                done(e);
            }
        });

        it('shoud find a declaration for a symbol', async done => {
            try {
                let items = await provider.buildQuickPickList(document, 'MyCla');
                items.should.be.an('array').with.lengthOf(1);
                items[0].label.should.equal('MyClass');
                done();
            } catch (e) {
                done(e);
            }
        });

        it('shoud possibly find multiple declarations for a symbol', async done => {
            try {
                let items = await provider.buildQuickPickList(document, 'Fancier');
                items.should.be.an('array').with.lengthOf(2);
                (items.every(o => o.label === 'FancierLibraryClass')).should.be.true;
                done();
            } catch (e) {
                done(e);
            }
        });

    });

});
