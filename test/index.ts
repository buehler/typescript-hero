import 'reflect-metadata';
import { ResolveIndex } from '../src/caches/ResolveIndex';
import { Injector } from '../src/IoC';
import { LocalWorkspaceResolveIndexMock } from './mocks/LocalWorkspaceResolveIndexMock';
import { ExtensionContext, Memento } from 'vscode';

//
// PLEASE DO NOT MODIFY / DELETE UNLESS YOU KNOW WHAT YOU ARE DOING
//
// This file is providing the test runner to use when running extension tests.
// By default the test runner in use is Mocha based.
//
// You can provide your own test runner if you want to override it by exporting
// a function run(testRoot: string, clb: (error:Error) => void) that the extension
// host can call to run the tests. The test runner is expected to use console.log
// to report the results back to the caller. When the tests are finished, return
// a possible error to the callback or null if none.


class ContextMock implements ExtensionContext {
    subscriptions: { dispose(): any }[] = [];
    workspaceState: Memento;
    globalState: Memento;
    extensionPath: string = '';
    storagePath: string = '';
    asAbsolutePath(relativePath: string): string {
        return '';
    }
}

Injector.bind<ExtensionContext>('context').toConstantValue(new ContextMock());
Injector.unbind(ResolveIndex);
Injector.bind(ResolveIndex).to(LocalWorkspaceResolveIndexMock).inSingletonScope();

const testRunner = require('vscode/lib/testrunner');

// You can directly control Mocha options by uncommenting the following lines
// See https://github.com/mochajs/mocha/wiki/Using-mocha-programmatically#set-options for more info
testRunner.configure({
    ui: 'bdd', 		// the TDD UI is being used in extension.test.ts (suite, test, etc.)
    useColors: true // colored output from test results
});

module.exports = testRunner;
