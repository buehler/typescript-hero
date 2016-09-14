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

    it('shoud order own files before typings / node modules');

    it('shoud order the declarations by name');

    it('shoud filter already imported named symbols');

    it('shoud filter already imported modules / namespaces');

    it('shoud filter already imported default imports');

    it('shoud resolve to 0 items for non found symbol');

    it('shoud find a declaration for a symbol');

    it('shoud possibly find multiple declarations for a symbol');

});
