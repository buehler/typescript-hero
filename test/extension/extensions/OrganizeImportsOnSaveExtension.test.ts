import * as chai from 'chai';
import { join } from 'path';
import { DeclarationIndex } from 'typescript-parser';
import * as vscode from 'vscode';

import { Container } from '../../../src/extension/IoC';
import { iocSymbols } from '../../../src/extension/IoCSymbols';

chai.should();

const rootPath = Container.get<string>(iocSymbols.rootPath);

describe('OrganizeImportsOnSaveExtension', () => {

    let document: vscode.TextDocument;
    let index: DeclarationIndex;

    before(async () => {
        const file = join(
            rootPath,
            'extension/extensions/organizeImportsOnSaveExtension/organizeFile.ts',
        );
        document = await vscode.workspace.openTextDocument(file);

        await vscode.window.showTextDocument(document);

        index = Container.get<DeclarationIndex>(iocSymbols.declarationIndex);
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

    it('should remove an unused import on save', async () => {
        console.log(document, index);
    });

    it('should not remove a used import on save');

    it('should not remove something if not saved');

});
