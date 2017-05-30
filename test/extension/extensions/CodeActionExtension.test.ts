import { TypescriptParser } from '../../../src/common/ts-parsing';
import { LoggerFactory } from '../../../src/common/utilities';
import { CodeAction } from '../../../src/extension/code-actions/CodeAction';
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
                    'server/indices/MyClass.ts'
                ),
                join(
                    workspace.rootPath,
                    'extension/extensions/codeActionExtension/implementInterfaceOrAbstract.ts'
                )
            ],
            workspace.rootPath
        );

        extension = new CodeActionExtension(ctx, logger, index as any, parser);
    });

    describe('executeCodeAction', () => {

        const file = join(
            workspace.rootPath,
            'extension/extensions/codeActionExtension/empty.ts'
        );
        let document: TextDocument;

        before(async () => {
            document = await workspace.openTextDocument(file);
            await window.showTextDocument(document);
        });

        afterEach(async () => {
            await window.activeTextEditor.edit(builder => {
                builder.delete(new Range(
                    new Position(0, 0),
                    document.lineAt(document.lineCount - 1).rangeIncludingLineBreak.end
                ));
            });
        });

        it('should call the execute method of a code action', async () => {
            let spy = sinon.spy();
            await extension.executeCodeAction(new SpyCodeAction(spy, true));
            spy.should.be.calledOnce;
        });

        it('should warn the user if the result is false', async () => {
            let stub = sinon.stub(window, 'showWarningMessage', () => {
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
            'extension/extensions/codeActionExtension/empty.ts'
        );
        let document: TextDocument;

        before(async () => {
            document = await workspace.openTextDocument(file);
            await window.showTextDocument(document);
        });

        afterEach(async () => {
            await window.activeTextEditor.edit(builder => {
                builder.delete(new Range(
                    new Position(0, 0),
                    document.lineAt(document.lineCount - 1).rangeIncludingLineBreak.end
                ));
            });
        });

        it('should add a missing import to a document', async () => {
            let cmds = await extension.provideCodeActions(
                document,
                new Range(new Position(0, 0), new Position(0, 0)),
                <any>{ diagnostics: [{ message: `Cannot find name 'Class1'.` }] },
                null
            );
            await extension.executeCodeAction(cmds[0].arguments[0]);
            document.lineAt(0).text.should.equal(`import { Class1 } from '../../../server/indices/MyClass';`);
        });

    });

    describe.skip('missingPolymorphicElements', () => {
        // TODO
        const file = join(workspace.rootPath, 'extension/extensions/codeActionExtension/implementInterfaceOrAbstract.ts');
        let document: TextDocument,
            documentText: string;

        before(async () => {
            document = await workspace.openTextDocument(file);
            await window.showTextDocument(document);
            documentText = document.getText();
        });

        afterEach(async () => {
            await window.activeTextEditor.edit(builder => {
                builder.delete(new Range(
                    new Position(0, 0),
                    document.lineAt(document.lineCount - 1).rangeIncludingLineBreak.end
                ));
                builder.insert(new Position(0, 0), documentText);
            });
        });

        it('should add interface elements to a class', async () => {
            let cmds = await extension.provideCodeActions(
                document,
                new Range(new Position(0, 0), new Position(0, 0)),
                <any>{ diagnostics: [{ message: `class 'InterfaceImplement' incorrectly implements 'CodeFixImplementInterface'.` }] },
                null
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
            let cmds = await extension.provideCodeActions(
                document,
                new Range(new Position(0, 0), new Position(0, 0)),
                <any>{ diagnostics: [{ message: `non-abstract class 'AbstractImplement' implement inherited from class 'CodeFixImplementAbstract'.` }] },
                null
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
            let cmds = await extension.provideCodeActions(
                document,
                new Range(new Position(0, 0), new Position(0, 0)),
                <any>{ diagnostics: [{ message: `class 'InternalInterfaceImplement' incorrectly implements 'InternalInterface'.` }] },
                null
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
            let cmds = await extension.provideCodeActions(
                document,
                new Range(new Position(0, 0), new Position(0, 0)),
                <any>{ diagnostics: [{ message: `non-abstract class 'InternalAbstractImplement' implement inherited from class 'InternalAbstract'.` }] },
                null
            );
            await extension.executeCodeAction(cmds[0].arguments[0]);
            document.lineAt(22).text.should.equal(`class InternalAbstractImplement extends InternalAbstract {`);
            document.lineAt(24).text.should.equal(`    public abstractMethod(): void {`);
            document.lineAt(25).text.should.equal(`        throw new Error('Not implemented yet.');`);
            document.lineAt(26).text.should.equal(`    }`);
            document.lineAt(27).text.should.equal(`}`);
        });

    });

});
