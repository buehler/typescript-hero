import { join } from 'path';
import { TypescriptParser } from 'typescript-parser';
import * as vscode from 'vscode';

import { ExtensionConfig } from '../../../src/common/config';
import { LoggerFactory } from '../../../src/common/utilities';
import { DocumentSymbolStructureExtension } from '../../../src/extension/extensions/DocumentSymbolStructureExtension';
import { Container } from '../../../src/extension/IoC';
import { iocSymbols } from '../../../src/extension/IoCSymbols';
import { BaseStructureTreeItem } from '../../../src/extension/provider-items/document-structure/BaseStructureTreeItem';
import {
    DeclarationStructureTreeItem,
} from '../../../src/extension/provider-items/document-structure/DeclarationStructureTreeItem';
import {
    DisabledStructureTreeItem,
} from '../../../src/extension/provider-items/document-structure/DisabledStructureTreeItem';
import { ImportsStructureTreeItem } from '../../../src/extension/provider-items/document-structure/ImportsStructureTreeItem';
import {
    NotParseableStructureTreeItem,
} from '../../../src/extension/provider-items/document-structure/NotParseableStructureTreeItem';

const rootPath = Container.get<string>(iocSymbols.rootPath);

describe('DocumentSymbolStructureExtension', () => {

    let extension: DocumentSymbolStructureExtension;
    let document: vscode.TextDocument;

    before(async () => {
        const file = join(
            rootPath,
            'extension/extensions/documentSymbolStructureExtension/documentSymbolFile.ts',
        );
        document = await vscode.workspace.openTextDocument(file);
        await vscode.window.showTextDocument(document);

        const ctx = Container.get<vscode.ExtensionContext>(iocSymbols.extensionContext);
        const logger = Container.get<LoggerFactory>(iocSymbols.loggerFactory);
        const parser = Container.get<TypescriptParser>(iocSymbols.typescriptParser);
        const config = Container.get<ExtensionConfig>(iocSymbols.configuration);

        extension = new DocumentSymbolStructureExtension(ctx, logger, config, parser);
    });

    it('should return an empty array if no active window is set', async () => {
        try {
            await vscode.commands.executeCommand('workbench.action.closeAllEditors');

            const elements = await extension.getChildren() as BaseStructureTreeItem[];
            elements.should.have.lengthOf(0);
        } finally {
            await vscode.window.showTextDocument(document);
        }
    });

    it('should return a "file not parsable" if it is no ts file', async () => {
        const rootPath = Container.get<string>(iocSymbols.rootPath);
        const file = join(
            rootPath,
            'extension/extensions/documentSymbolStructureExtension/notParsable.txt',
        );
        const txtDocument = await vscode.workspace.openTextDocument(file);
        await vscode.window.showTextDocument(txtDocument);

        const elements = await extension.getChildren() as BaseStructureTreeItem[];
        elements[0].should.be.instanceof(NotParseableStructureTreeItem);

        await vscode.commands.executeCommand('workbench.action.closeAllEditors');
        await vscode.window.showTextDocument(document);
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
