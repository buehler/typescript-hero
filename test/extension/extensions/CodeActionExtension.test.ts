import { TypescriptParser } from '../../../src/common/ts-parsing';
import { LoggerFactory } from '../../../src/common/utilities';
import {
    AddImportCodeAction,
    CodeAction,
    ImplementPolymorphElements,
} from '../../../src/extension/code-actions/CodeAction';
import {
    MissingImplementationInClassCreator,
} from '../../../src/extension/code-actions/MissingImplementationInClassCreator';
import { MissingImportCreator } from '../../../src/extension/code-actions/MissingImportCreator';
import { CodeActionExtension } from '../../../src/extension/extensions/CodeActionExtension';
import { Container } from '../../../src/extension/IoC';
import { iocSymbols } from '../../../src/extension/IoCSymbols';
import { DeclarationIndex } from '../../../src/server/indices/DeclarationIndex';
import * as chai from 'chai';
import { join } from 'path';
import * as sinon from 'sinon';
import { ExtensionContext, Position, Range, TextDocument, window, workspace } from 'vscode';

chai.should();

class SpyCodeAction implements CodeAction {
    constructor(private spy: sinon.SinonSpy, private result: boolean) { }

    public async execute(): Promise<boolean> {
        this.spy();
        return this.result;
    }
}

describe('CodeActionExtension', () => {

    let extension: any;

    before(async () => {
        const ctx = Container.get<ExtensionContext>(iocSymbols.extensionContext);
        const logger = Container.get<LoggerFactory>(iocSymbols.loggerFactory);
        const parser = Container.get(TypescriptParser);

        const index = new DeclarationIndex(logger, parser);
        await index.buildIndex(
            [
                join(
                    workspace.rootPath,
                    'server/indices/MyClass.ts',
                ),
                join(
                    workspace.rootPath,
                    'extension/extensions/codeActionExtension/exportedObjects.ts',
                ),
                join(
                    workspace.rootPath,
                    'extension/extensions/codeActionExtension/implementInterfaceOrAbstract.ts',
                ),
                join(
                    workspace.rootPath,
                    'node_modules/fancy-library/FancierLibraryClass.d.ts',
                ),
            ],
            workspace.rootPath,
        );

        const creators = [
            new MissingImportCreator(index as any),
            new MissingImplementationInClassCreator(parser, index as any),
        ];

        extension = new CodeActionExtension(ctx, logger, creators);
    });

    describe('executeCodeAction', () => {

        const file = join(
            workspace.rootPath,
            'extension/extensions/codeActionExtension/empty.ts',
        );
        let document: TextDocument;

        before(async () => {
            document = await workspace.openTextDocument(file);
            await window.showTextDocument(document);
        });

        afterEach(async () => {
            await window.activeTextEditor.edit((builder) => {
                builder.delete(new Range(
                    new Position(0, 0),
                    document.lineAt(document.lineCount - 1).rangeIncludingLineBreak.end,
                ));
            });
        });

        it('should call the execute method of a code action', async () => {
            const spy = sinon.spy();
            await extension.executeCodeAction(new SpyCodeAction(spy, true));
            spy.should.be.calledOnce;
        });

        it('should warn the user if the result is false', async () => {
            const stub = sinon.stub(window, 'showWarningMessage', () => {
                return Promise.resolve();
            });

            try {
                await extension.executeCodeAction(new SpyCodeAction(sinon.spy(), false));
                stub.should.be.calledWith('The provided code action could not complete. Please see the logs.');
            } finally {
                stub.restore();
            }
        });

    });

    describe('missingImport', () => {

        const file = join(
            workspace.rootPath,
            'extension/extensions/codeActionExtension/empty.ts',
        );
        let document: TextDocument;

        before(async () => {
            document = await workspace.openTextDocument(file);
            await window.showTextDocument(document);
        });

        afterEach(async () => {
            await window.activeTextEditor.edit((builder) => {
                builder.delete(new Range(
                    new Position(0, 0),
                    document.lineAt(document.lineCount - 1).rangeIncludingLineBreak.end,
                ));
            });
        });

        it('should add a missing import to a document', async () => {
            const cmds = await extension.provideCodeActions(
                document,
                new Range(new Position(0, 0), new Position(0, 0)),
                <any>{ diagnostics: [{ message: `Cannot find name 'Class1'.` }] },
                null,
            );
            await extension.executeCodeAction(cmds[0].arguments[0]);
            document.lineAt(0).text.should.equal(`import { Class1 } from '../../../server/indices/MyClass';`);
        });

    });

    describe('missingPolymorphicElements', () => {
        const file = join(workspace.rootPath, 'extension/extensions/codeActionExtension/implementInterfaceOrAbstract.ts');
        let document: TextDocument;
        let documentText: string;

        before(async () => {
            document = await workspace.openTextDocument(file);
            await window.showTextDocument(document);
            documentText = document.getText();
        });

        afterEach(async () => {
            await window.activeTextEditor.edit((builder) => {
                builder.delete(new Range(
                    new Position(0, 0),
                    document.lineAt(document.lineCount - 1).rangeIncludingLineBreak.end,
                ));
                builder.insert(new Position(0, 0), documentText);
            });
        });

        it('should add interface elements to a class', async () => {
            const cmds = await extension.provideCodeActions(
                document,
                new Range(new Position(0, 0), new Position(0, 0)),
                <any>{
                    diagnostics: [
                        { message: `class 'InterfaceImplement' incorrectly implements 'CodeFixImplementInterface'.` },
                    ],
                },
                null,
            );
            await extension.executeCodeAction(cmds[0].arguments[0]);
            document.lineAt(3).text.should.equal(`class InterfaceImplement implements CodeFixImplementInterface {`);
            document.lineAt(4).text.should.equal(`    public property: number;`);
            document.lineAt(6).text.should.equal(`    public interfaceMethod(): string {`);
            document.lineAt(7).text.should.equal(`        throw new Error('Not implemented yet.');`);
            document.lineAt(8).text.should.equal(`    }`);
            document.lineAt(10).text.should.equal(`    public interfaceMethodWithParams(p1: string, p2): number {`);
            document.lineAt(11).text.should.equal(`        throw new Error('Not implemented yet.');`);
            document.lineAt(12).text.should.equal(`    }`);
            document.lineAt(13).text.should.equal(`}`);
        });

        it('should add abstract class elements to a class', async () => {
            const cmds = await extension.provideCodeActions(
                document,
                new Range(new Position(0, 0), new Position(0, 0)),
                <any>{
                    diagnostics: [
                        {
                            message: `non-abstract class 'AbstractImplement' ` +
                            `implement inherited from class 'CodeFixImplementAbstract'.`,
                        },
                    ],
                },
                null,
            );
            await extension.executeCodeAction(cmds[0].arguments[0]);
            document.lineAt(6).text.should.equal(`class AbstractImplement extends CodeFixImplementAbstract {`);
            document.lineAt(7).text.should.equal(`    public pubProperty: string;`);
            document.lineAt(9).text.should.equal(`    public abstractMethod(): void {`);
            document.lineAt(10).text.should.equal(`        throw new Error('Not implemented yet.');`);
            document.lineAt(11).text.should.equal(`    }`);
            document.lineAt(13).text.should.equal(`    public abstractMethodWithParams(p1: string, p2): number {`);
            document.lineAt(14).text.should.equal(`        throw new Error('Not implemented yet.');`);
            document.lineAt(15).text.should.equal(`    }`);
            document.lineAt(16).text.should.equal(`}`);
        });

        it('should add local interface elements to a class', async () => {
            const cmds = await extension.provideCodeActions(
                document,
                new Range(new Position(0, 0), new Position(0, 0)),
                <any>{
                    diagnostics: [
                        { message: `class 'InternalInterfaceImplement' incorrectly implements 'InternalInterface'.` },
                    ],
                },
                null,
            );
            await extension.executeCodeAction(cmds[0].arguments[0]);
            document.lineAt(19).text.should.equal(`class InternalInterfaceImplement implements InternalInterface {`);
            document.lineAt(21).text.should.equal(`    public method(p1: string): void {`);
            document.lineAt(22).text.should.equal(`        throw new Error('Not implemented yet.');`);
            document.lineAt(23).text.should.equal(`    }`);
            document.lineAt(25).text.should.equal(`    public methodTwo() {`);
            document.lineAt(26).text.should.equal(`        throw new Error('Not implemented yet.');`);
            document.lineAt(27).text.should.equal(`    }`);
            document.lineAt(28).text.should.equal(`}`);
        });

        it('should add local abstract class elements to a class', async () => {
            const cmds = await extension.provideCodeActions(
                document,
                new Range(new Position(0, 0), new Position(0, 0)),
                <any>{
                    diagnostics: [
                        {
                            message:
                            `non-abstract class 'InternalAbstractImplement' ` +
                            `implement inherited from class 'InternalAbstract'.`,
                        },
                    ],
                },
                null,
            );
            await extension.executeCodeAction(cmds[0].arguments[0]);
            document.lineAt(22).text.should.equal(`class InternalAbstractImplement extends InternalAbstract {`);
            document.lineAt(24).text.should.equal(`    public abstractMethod(): void {`);
            document.lineAt(25).text.should.equal(`        throw new Error('Not implemented yet.');`);
            document.lineAt(26).text.should.equal(`    }`);
            document.lineAt(27).text.should.equal(`}`);
        });

    });

    describe('provideCodeActions', () => {

        const file = join(
            workspace.rootPath,
            'extension/extensions/codeActionExtension/empty.ts',
        );
        let document: TextDocument;

        before(async () => {
            document = await workspace.openTextDocument(file);
            await window.showTextDocument(document);
        });

        it('should not resolve to a code action if the problem is not recognized', async () => {
            const cmds = await extension.provideCodeActions(
                document,
                new Range(new Position(0, 0), new Position(0, 0)),
                { diagnostics: [{ message: `I really do have a problem mate..` }] },
                null,
            );
            cmds.should.have.lengthOf(0);
        });

        describe('missing import actions', () => {

            it('should resolve a missing import problem to a code action', async () => {
                const cmds = await extension.provideCodeActions(
                    document,
                    new Range(new Position(0, 0), new Position(0, 0)),
                    { diagnostics: [{ message: `Cannot find name 'Class1'.` }] },
                    null,
                );

                cmds.should.have.lengthOf(2);
                const action = cmds[0];
                action.title.should.equal('Import "Class1" from "/server/indices/MyClass".');
                action.arguments[0].should.be.an.instanceof(AddImportCodeAction);
            });

            it('should resolve to a NOOP code action if the missing import is not found in the index', async () => {
                const cmds = await extension.provideCodeActions(
                    document,
                    new Range(new Position(0, 0), new Position(0, 0)),
                    { diagnostics: [{ message: `Cannot find name 'FOOOOBAR'.` }] },
                    null,
                );
                cmds.should.have.lengthOf(1);
                cmds[0].title.should.equal('Cannot find "FOOOOBAR" in the index.');
            });

            it('should add multiple code actions for multiple declarations found', async () => {
                const cmds = await extension.provideCodeActions(
                    document,
                    new Range(new Position(0, 0), new Position(0, 0)),
                    { diagnostics: [{ message: `Cannot find name 'FancierLibraryClass'.` }] },
                    null,
                );

                cmds.should.have.lengthOf(3);
                let action = cmds[0];
                action.title.should.equal('Import "FancierLibraryClass" from "/server/indices/MyClass".');
                action.arguments[0].should.be.an.instanceof(AddImportCodeAction);

                action = cmds[1];
                action.title.should.equal('Import "FancierLibraryClass" from "fancy-library/FancierLibraryClass".');
                action.arguments[0].should.be.an.instanceof(AddImportCodeAction);
            });

        });

    });

    describe('missing polymorphic elements actions', () => {

        const file = join(
            workspace.rootPath,
            'extension/extensions/codeActionExtension/implementInterfaceOrAbstract.ts',
        );
        let document: TextDocument;

        before(async () => {
            document = await workspace.openTextDocument(file);
            await window.showTextDocument(document);
        });

        it('should resolve missing implementations of an interface to a code action', async () => {
            const cmds = await extension.provideCodeActions(
                document,
                new Range(new Position(0, 0), new Position(0, 0)),
                { diagnostics: [{ message: `class 'Foobar' incorrectly implements 'CodeFixImplementInterface'.` }] },
                null,
            );

            cmds.should.have.lengthOf(1);
            const action = cmds[0];
            action.title.should.equal('Implement missing elements from "CodeFixImplementInterface".');
            action.arguments[0].should.be.an.instanceof(ImplementPolymorphElements);
        });

        it('should resolve missing implementations of an abstract class to a code action', async () => {
            const cmds = await extension.provideCodeActions(
                document,
                new Range(new Position(0, 0), new Position(0, 0)),
                {
                    diagnostics: [
                        {
                            message:
                            `non-abstract class 'Foobar' implement inherited from class 'CodeFixImplementAbstract'.`,
                        },
                    ],
                },
                null,
            );

            cmds.should.have.lengthOf(1);
            const action = cmds[0];
            action.title.should.equal('Implement missing elements from "CodeFixImplementAbstract".');
            action.arguments[0].should.be.an.instanceof(ImplementPolymorphElements);
        });

        it('should resolve missing implementations of a local interface to a code action', async () => {
            const cmds = await extension.provideCodeActions(
                document,
                new Range(new Position(0, 0), new Position(0, 0)),
                { diagnostics: [{ message: `class 'Foobar' incorrectly implements 'InternalInterface'.` }] },
                null,
            );

            cmds.should.have.lengthOf(1);
            const action = cmds[0];
            action.title.should.equal('Implement missing elements from "InternalInterface".');
            action.arguments[0].should.be.an.instanceof(ImplementPolymorphElements);
        });

        it('should resolve missing implementations of a local abstract class to a code action', async () => {
            const cmds = await extension.provideCodeActions(
                document,
                new Range(new Position(0, 0), new Position(0, 0)),
                {
                    diagnostics: [
                        { message: `non-abstract class 'Foobar' implement inherited from class 'InternalAbstract'.` },
                    ],
                },
                null,
            );

            cmds.should.have.lengthOf(1);
            const action = cmds[0];
            action.title.should.equal('Implement missing elements from "InternalAbstract".');
            action.arguments[0].should.be.an.instanceof(ImplementPolymorphElements);
        });

        it('should resolve missing to a NOOP if the interface / class is not found', async () => {
            const cmds = await extension.provideCodeActions(
                document,
                new Range(new Position(0, 0), new Position(0, 0)),
                { diagnostics: [{ message: `non-abstract class 'Foobar' implement inherited from class 'FOOOOBAR'.` }] },
                null,
            );

            cmds.should.have.lengthOf(1);
            cmds[0].title.should.equal('Cannot find "FOOOOBAR" in the index or the actual file.');
        });

    });

});
