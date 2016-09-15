import {Injector} from '../../src/IoC';
import {ResolveExtension} from '../../src/extensions/ResolveExtension';
import * as chai from 'chai';
import * as vscode from 'vscode';
import {join} from 'path';

chai.should();

// TODO: refactor extension code, so it can be tested (vscode.window.activeTextEditor is null!)

// describe('ResolveExtension', () => {

//     let extension: ResolveExtension;

//     before(() => {
//         extension = Injector.getAll<ResolveExtension>('Extension').find(o => o instanceof ResolveExtension);
//     });

//     describe('addImportToDocument', () => {

//         const file = join(process.cwd(), '.test/resolveExtension/addImportToDocument.ts');
//         let document: vscode.TextDocument;

//         before(() => vscode.workspace.openTextDocument(file).then(doc => document = doc));

//         afterEach(() => {
//             console.log(vscode.window.activeTextEditor);
//         });

//         it('shoud write a module / namespace import correctly', done => {
//             let ext: any = extension;
//             ext.pickProvider.buildQuickPickList(document, 'bodyParser')
//                 .then(items => {
//                     console.log(items);
//                 })
//                 .catch(done);
//         });

//         it('shoud write a named import correctly');

//         it('shoud update a named import correcty');

//         it('shoud use the correct relative path');

//         it('shoud only use forward slashes');

//         it('shoud use ./ for same directory files');

//         it('shoud remove /index from ../index.ts files');

//         it('should correctly use ../ for parent index files');

//     });

//     describe('organizeImports', () => {

//         it('shoud remove unused imports');

//         it('shoud order string imports to the top');

//         it('shoud order libraries by name');

//         it('shoud order specifiers by name');

//     });

// });
