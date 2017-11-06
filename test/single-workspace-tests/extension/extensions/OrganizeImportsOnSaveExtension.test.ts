import * as chai from 'chai';
import { join } from 'path';
import { DeclarationIndex } from 'typescript-parser';
import * as vscode from 'vscode';

import { Container } from '../../../../src/extension/IoC';
import { iocSymbols } from '../../../../src/extension/IoCSymbols';
import { ImportManager } from '../../../../src/extension/managers';

chai.should();


describe('OrganizeImportsOnSaveExtension', () => {

    const rootPath = vscode.workspace.workspaceFolders![0].uri.fsPath;
    let document: vscode.TextDocument;
    let documentText: string;
    let index: DeclarationIndex;

    before(async () => {
        const file = join(
            rootPath,
            'extension/extensions/organizeImportsOnSaveExtension/organizeFile.ts',
        );
        document = await vscode.workspace.openTextDocument(file);
        documentText = document.getText()

        await vscode.window.showTextDocument(document);

        index = new DeclarationIndex(Container.get(iocSymbols.typescriptParser), rootPath);
        await index.buildIndex(
            [
                join(
                    rootPath,
                    'server/indices/MyClass.ts',
                ),
            ],
        );

        const config = vscode.workspace.getConfiguration('typescriptHero');
        await config.update('resolver.organizeOnSave', true);
    });

    after(async () => {
        const config = vscode.workspace.getConfiguration('typescriptHero');
        await config.update('resolver.organizeOnSave', false);
        await vscode.window.activeTextEditor!.edit((builder) => {
            builder.delete(new vscode.Range(
                new vscode.Position(0, 0),
                document.lineAt(document.lineCount - 1).rangeIncludingLineBreak.end,
            ));
            builder.insert(new vscode.Position(0, 0), documentText);
        });
        await document.save()
    });

    afterEach(async () => {
        await vscode.window.activeTextEditor!.edit((builder) => {
            builder.delete(new vscode.Range(
                new vscode.Position(0, 0),
                document.lineAt(document.lineCount - 1).rangeIncludingLineBreak.end,
            ));
        });
    });

    it('should remove an unused import on save', async function () {
        this.timeout(4000);
        const ctrl = await ImportManager.create(document);
        const declaration = index.declarationInfos.find(o => o.declaration.name === 'Class1');
        ctrl.addDeclarationImport(declaration!);
        await ctrl.commit();

        document.lineAt(0).text.should.equals(
            `import { Class1 } from '../../../server/indices/MyClass';`,
        );

        await document.save();

        document.lineAt(0).text.should.equals('');
    });

    it('should not remove a used import on save', async function () {
        this.timeout(4000);
        const ctrl = await ImportManager.create(document);
        const declaration = index.declarationInfos.find(o => o.declaration.name === 'Class1');
        const declaration2 = index.declarationInfos.find(o => o.declaration.name === 'Class2');
        ctrl.addDeclarationImport(declaration!).addDeclarationImport(declaration2!);
        await ctrl.commit();

        document.lineAt(0).text.should.equals(
            `import { Class1, Class2 } from '../../../server/indices/MyClass';`,
        );

        await vscode.window.activeTextEditor!.edit((builder) => {
            builder.insert(
                new vscode.Position(1, 0),
                'let a = new Class2()',
            );
        });

        await document.save();

        document.lineAt(0).text.should.equals(
            `import { Class2 } from '../../../server/indices/MyClass';`,
        );
    });

    it('should not remove an unused import on save when disableImportRemovalOnOrganize is true', async () => {
        const config = vscode.workspace.getConfiguration('typescriptHero');
        await config.update('resolver.disableImportRemovalOnOrganize', true);

        const ctrl = await ImportManager.create(document);
        const declaration = index.declarationInfos.find(o => o.declaration.name === 'Class1');
        const declaration2 = index.declarationInfos.find(o => o.declaration.name === 'Class2');
        ctrl.addDeclarationImport(declaration!).addDeclarationImport(declaration2!);
        await ctrl.commit();

        document.lineAt(0).text.should.equals(
            `import { Class1, Class2 } from '../../../server/indices/MyClass';`,
        );

        await vscode.window.activeTextEditor!.edit((builder) => {
            builder.insert(
                new vscode.Position(1, 0),
                'let a = new Class2()',
            );
        });

        await document.save();

        document.lineAt(0).text.should.equals(
            `import { Class1, Class2 } from '../../../server/indices/MyClass';`,
        );

        await config.update('resolver.disableImportRemovalOnOrganize', false);
    });

});
