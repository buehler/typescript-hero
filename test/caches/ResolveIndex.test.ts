import 'reflect-metadata';
import {ResolveIndex} from '../../src/caches/ResolveIndex';
import {Injector} from '../../src/IoC';
import * as chai from 'chai';
import {ExtensionContext, Memento} from 'vscode';

chai.should();

class ContextMock implements ExtensionContext {
    subscriptions: { dispose(): any }[] = [];
    workspaceState: Memento;
    globalState: Memento;
    extensionPath: string = '';
    asAbsolutePath(relativePath: string): string {
        return '';
    }
}

Injector.bind<ExtensionContext>('context').toConstantValue(new ContextMock());

describe('ResolveIndex', () => {

    let index: ResolveIndex;

    beforeEach(() => {
        index = Injector.get(ResolveIndex);
    });

    it('should be tested', () => {
        console.log(index);
    });

});
