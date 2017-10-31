import { join } from 'path';
import { TypescriptParser } from 'typescript-parser';
import * as vscode from 'vscode';

import { ConfigFactory } from '../../../../src/common/factories';
import { DocumentSymbolStructureExtension } from '../../../../src/extension/extensions/DocumentSymbolStructureExtension';
import { Container } from '../../../../src/extension/IoC';
import { iocSymbols } from '../../../../src/extension/IoCSymbols';
import { BaseStructureTreeItem } from '../../../../src/extension/provider-items/document-structure/BaseStructureTreeItem';
import {
    DeclarationStructureTreeItem,
} from '../../../../src/extension/provider-items/document-structure/DeclarationStructureTreeItem';
import {
    DisabledStructureTreeItem,
} from '../../../../src/extension/provider-items/document-structure/DisabledStructureTreeItem';
import {
    ImportsStructureTreeItem,
} from '../../../../src/extension/provider-items/document-structure/ImportsStructureTreeItem';
import {
    NotParseableStructureTreeItem,
} from '../../../../src/extension/provider-items/document-structure/NotParseableStructureTreeItem';
import { Logger } from '../../../../src/extension/utilities/winstonLogger';


describe('DocumentSymbolStructureExtension', () => {

    const rootPath = vscode.workspace.workspaceFolders![0].uri.fsPath;
    let extension: DocumentSymbolStructureExtension;
    const file = join(
        rootPath,
        'extension/extensions/documentSymbolStructureExtension/documentSymbolFile.ts',
    );

    before(async () => {
        const ctx = Container.get<vscode.ExtensionContext>(iocSymbols.extensionContext);
        const logger = Container.get<Logger>(iocSymbols.logger);
        const parser = Container.get<TypescriptParser>(iocSymbols.typescriptParser);
        const config = Container.get<ConfigFactory>(iocSymbols.configuration);

        extension = new DocumentSymbolStructureExtension(ctx, logger, config, parser);
    });

    beforeEach(async () => {
        const document = await vscode.workspace.openTextDocument(file);
        await vscode.window.showTextDocument(document);
    });

    afterEach(async () => {
        await vscode.commands.executeCommand('workbench.action.closeAllEditors');
    });

    it.skip('should return an empty array if no active window is set', async () => {
        await vscode.commands.executeCommand('workbench.action.closeAllEditors');

        const elements = await extension.getChildren() as BaseStructureTreeItem[];
        elements.should.have.lengthOf(0);
    });

    it('should return a "file not parsable" if it is no ts file', async () => {
        const file = join(
            rootPath,
            'extension/extensions/documentSymbolStructureExtension/notParsable.txt',
        );
        const txtDocument = await vscode.workspace.openTextDocument(file);
        await vscode.window.showTextDocument(txtDocument);

        const elements = await extension.getChildren() as BaseStructureTreeItem[];
        elements[0].should.be.instanceof(NotParseableStructureTreeItem);

        await vscode.commands.executeCommand('workbench.action.closeAllEditors');
    });

    it('should return a "not enabled" if the part is disabled via config', async () => {
        const config = vscode.workspace.getConfiguration('typescriptHero');

        try {
            await config.update('codeOutline.enabled', false);
            const elements = await extension.getChildren() as BaseStructureTreeItem[];
            elements[0].should.be.instanceof(DisabledStructureTreeItem);
        } finally {
            await config.update('codeOutline.enabled', true);
        }
    });

    it('should return the document code structure for a valid file', async () => {
        const elements = await extension.getChildren() as BaseStructureTreeItem[];

        elements[0].should.be.instanceof(ImportsStructureTreeItem);
        elements[1].should.be.instanceof(DeclarationStructureTreeItem);
        elements[2].should.be.instanceof(DeclarationStructureTreeItem);

        elements[1].label.should.equal('Yay');
        elements[2].label.should.equal('ArrList<T>');

        elements[2].getChildren().should.have.lengthOf(1);
        elements[2].getChildren()[0].label.should.equal('method(param: T): T');
    });

});
