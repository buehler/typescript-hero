import { Injector } from '../../src/IoC';
import { TypescriptCodeActionProvider } from '../../src/provider/TypescriptCodeActionProvider';
import * as chai from 'chai';

chai.should();

describe('TypescriptCodeActionProvider', () => {

    let provider: any;

    before(() => {
        provider = Injector.get(TypescriptCodeActionProvider);
    });

    describe('provideCodeActions()', () => {

        it('should resolve a missing import problem to a code action');

        it('should not resolve to a code action if the missing import is not found in the index');

        it('should not resolve to a code action if the problem is not recognized');

    });

    describe('createCommand()', () => {

        it('should create a command with the corresponding vscode command');

        it('should create a command with the correct code action and title');

    });

});
