import * as chai from 'chai';
import { join } from 'path';
import { DeclarationIndex } from 'typescript-parser';
import * as vscode from 'vscode';

import { Container } from '../../../src/extension/IoC';
import { iocSymbols } from '../../../src/extension/IoCSymbols';

chai.should();

const rootPath = Container.get<string>(iocSymbols.rootPath);

describe('ImportHelpers', () => {

    const file = join(rootPath, 'common/helpers/importHelperFile.ts');
    let document: vscode.TextDocument;

    before(async () => {
        document = await vscode.workspace.openTextDocument(file);
        await vscode.window.showTextDocument(document);

        const index = Container.get<DeclarationIndex>(iocSymbols.declarationIndex);
        await index.buildIndex(
            [
                join(
                    rootPath,
                    'server/indices/MyClass.ts',
                ),
            ],
        );
    });

    afterEach(async () => {
        await vscode.window.activeTextEditor!.edit((builder) => {
            builder.delete(new vscode.Range(
                new vscode.Position(0, 0),
                document.lineAt(document.lineCount - 1).rangeIncludingLineBreak.end,
            ));
        });
    });

    describe('getImportInsertPosition', () => {

        it('should return the top position if empty file');

        it('should return correct position for commented file');

        it('should return correct position for use strict');

        it('should return correct position for jsdoc comment open');

        it('should return correct position for jsdoc comment line');

        it('should return correct position for jsdoc comment close');

    });

});
