import { join } from 'path';
import { Resource, TypescriptParser } from '../../../src/common/ts-parsing';
import * as vscode from 'vscode';


describe('common / TypescriptParser', () => {

    let parser: TypescriptParser,
        parsed: Resource;

    beforeEach(() => {
        parser = new TypescriptParser();
    });

    describe('Import parsing', () => {

        const file = join(vscode.workspace.rootPath, 'common/ts-parsing/importsOnly.ts');

        beforeEach(async done => {
            parsed = await parser;
            done();
        });

    });

});
