import * as chai from 'chai';
import { join } from 'path';
import sinonChai = require('sinon-chai');
import {
    ClassDeclaration,
    DeclarationIndex,
    DeclarationVisibility,
    MethodDeclaration,
    ParameterDeclaration,
} from 'typescript-parser';
import { Position, Range, TextDocument, window, workspace } from 'vscode';

import { findFiles } from '../../../src/extension/extensions/ImportResolveExtension';
import { Container } from '../../../src/extension/IoC';
import { iocSymbols } from '../../../src/extension/IoCSymbols';
import { ClassManager } from '../../../src/extension/managers/ClassManager';
import { VscodeExtensionConfig } from '../../../src/extension/VscodeExtensionConfig';

const should = chai.should();
chai.use(sinonChai);

describe('ClassManager', () => {

    const file = join(workspace.rootPath!, 'extension/managers/ClassManagerFile.ts');
    let document: TextDocument;
    let documentText: string;
    let index: DeclarationIndex;
    let files: string[];

    before(async () => {
        const config = new VscodeExtensionConfig();
        files = await findFiles(config);

        index = Container.get<DeclarationIndex>(iocSymbols.declarationIndex);
        await index.buildIndex(files);

        document = await workspace.openTextDocument(file);
        await window.showTextDocument(document);
        documentText = document.getText();
    });

    describe('static create()', () => {

        it('should create an instance of a class manager', async () => {
            const ctrl = await ClassManager.create(document, 'ManagedClass');
            ctrl.should.be.an.instanceof(ClassManager);
        });

        it('should select the correct class that should be managed', async () => {
            const ctrl = await ClassManager.create(document, 'ManagedClass');
            const declaration = (ctrl as any).managedClass as ClassDeclaration;

            should.exist(declaration);
            declaration.name.should.equal('ManagedClass');
            declaration.should.be.an.instanceof(ClassDeclaration);
        });

        it('should throw when a class is not found', (done) => {
            const fn = async () => await ClassManager.create(document, 'NonExistingClass');

            fn()
                .then(() => done(new Error('did not throw.')))
                .catch(() => done());
        });

    });

    describe('addProperty()', () => {

        it('should add a property to the class array', async () => {
            const ctrl = await ClassManager.create(document, 'ManagedClassWithProperties');

            (ctrl as any).properties.should.have.lengthOf(3);
            ctrl.addProperty('newProperty', DeclarationVisibility.Public, 'string');
            (ctrl as any).properties.should.have.lengthOf(4);
            ((ctrl as any).properties.every(o => !!o.object)).should.be.true;
        });

        it('should set the isNew flag of Changeable<T>', async () => {
            const ctrl = await ClassManager.create(document, 'ManagedClassWithProperties');

            ctrl.addProperty('newProperty', DeclarationVisibility.Public, 'string');
            (ctrl as any).properties[3].isNew.should.be.true;
        });

        it('should not set the other flags of Changeable<T>', async () => {
            const ctrl = await ClassManager.create(document, 'ManagedClassWithProperties');

            ctrl.addProperty('newProperty', DeclarationVisibility.Public, 'string');
            (ctrl as any).properties[3].isModified.should.be.false;
            (ctrl as any).properties[3].isDeleted.should.be.false;
        });

        it('should throw when adding a duplicate property', (done) => {
            const fn = async () => {
                const ctrl = await ClassManager.create(document, 'ManagedClassWithProperties');
                ctrl.addProperty('foo', DeclarationVisibility.Public, 'string');
            };

            fn()
                .then(() => done(new Error('did not throw.')))
                .catch(() => done());
        });

    });

    describe('removeProperty()', () => {

        it('should set the deleted flag of Changeable<T>', async () => {
            const ctrl = await ClassManager.create(document, 'ManagedClassWithProperties');

            (ctrl as any).properties[0].isDeleted.should.be.false;
            ctrl.removeProperty('foo');
            (ctrl as any).properties[0].isDeleted.should.be.true;
        });

        it('should not remove the element from the array when not new', async () => {
            const ctrl = await ClassManager.create(document, 'ManagedClassWithProperties');

            (ctrl as any).properties.should.have.lengthOf(3);
            ctrl.removeProperty('foo');
            (ctrl as any).properties.should.have.lengthOf(3);
        });

        it('should remove a new property when deleted immediatly', async () => {
            const ctrl = await ClassManager.create(document, 'ManagedClassWithProperties');

            (ctrl as any).properties.should.have.lengthOf(3);
            ctrl.addProperty('newProp', DeclarationVisibility.Public, 'string');
            (ctrl as any).properties.should.have.lengthOf(4);
            ctrl.removeProperty('newProp');
            (ctrl as any).properties.should.have.lengthOf(3);
        });

        it('should throw when a property is not found', (done) => {
            const fn = async () => {
                const ctrl = await ClassManager.create(document, 'ManagedClassWithProperties');
                ctrl.removeProperty('whatever');
            };

            fn()
                .then(() => done(new Error('did not throw.')))
                .catch(() => done());
        });

    });

    describe('addMethod()', () => {

        it('should add a method to the class array with a name', async () => {
            const ctrl = await ClassManager.create(document, 'ManagedClassWithMethods');

            (ctrl as any).methods.should.have.lengthOf(3);
            ctrl.addMethod('newMethod');
            (ctrl as any).methods.should.have.lengthOf(4);
            ((ctrl as any).methods.every(o => !!o.object)).should.be.true;
        });

        it('should add a method to the class array with a declaration', async () => {
            const ctrl = await ClassManager.create(document, 'ManagedClassWithMethods');
            const decl = new MethodDeclaration('newMethod', false, DeclarationVisibility.Public, 'string');

            (ctrl as any).methods.should.have.lengthOf(3);
            ctrl.addMethod(decl);
            (ctrl as any).methods.should.have.lengthOf(4);
            ((ctrl as any).methods.every(o => !!o.object)).should.be.true;
        });

        it('should set the isNew flag of Changeable<T>', async () => {
            const ctrl = await ClassManager.create(document, 'ManagedClassWithMethods');

            ctrl.addMethod('newMethod');
            (ctrl as any).methods[3].isNew.should.be.true;
        });

        it('should throw when adding a duplicate method', (done) => {
            const fn = async () => {
                const ctrl = await ClassManager.create(document, 'ManagedClassWithMethods');
                ctrl.addMethod('whatever');
            };

            fn()
                .then(() => done(new Error('did not throw.')))
                .catch(() => done());
        });

    });

    describe('removeMethod()', () => {

        it('should set the deleted flag of Changeable<T>', async () => {
            const ctrl = await ClassManager.create(document, 'ManagedClassWithMethods');

            (ctrl as any).methods[0].isDeleted.should.be.false;
            ctrl.removeMethod('method');
            (ctrl as any).methods[0].isDeleted.should.be.true;
        });

        it('should not remove the element from the array when not new', async () => {
            const ctrl = await ClassManager.create(document, 'ManagedClassWithMethods');

            (ctrl as any).methods.should.have.lengthOf(3);
            ctrl.removeMethod('method');
            (ctrl as any).methods.should.have.lengthOf(3);
        });

        it('should remove a new method when deleted immediatly', async () => {
            const ctrl = await ClassManager.create(document, 'ManagedClassWithMethods');

            (ctrl as any).methods.should.have.lengthOf(3);
            ctrl.addMethod('randomMethod');
            (ctrl as any).methods.should.have.lengthOf(4);
            ctrl.removeMethod('randomMethod');
            (ctrl as any).methods.should.have.lengthOf(3);
        });

        it('should throw when a method is not found', (done) => {
            const fn = async () => {
                const ctrl = await ClassManager.create(document, 'ManagedClassWithMethods');
                ctrl.removeMethod('foobar');
            };

            fn()
                .then(() => done(new Error('did not throw.')))
                .catch(() => done());
        });

    });

    describe('commit()', () => {

        afterEach(async () => {
            await window.activeTextEditor!.edit((builder) => {
                builder.delete(new Range(
                    new Position(0, 0),
                    document.lineAt(document.lineCount - 1).rangeIncludingLineBreak.end,
                ));
                builder.insert(new Position(0, 0), documentText);
            });
        });

        it('should not touch anything if there has nothing changed', async () => {
            const ctrl = await ClassManager.create(document, 'ManagedClassWithMethods');

            await window.activeTextEditor!.edit((builder) => {
                builder.replace(document.lineAt(10).rangeIncludingLineBreak, `public fooobar(): string {   }`);
            });

            (await ctrl.commit()).should.be.true;

            document.lineAt(10).text.should.equal(`public fooobar(): string {   }`);
        });

        it('should add a new property to a class without properties', async () => {
            const ctrl = await ClassManager.create(document, 'ManagedClassWithMethods');

            ctrl.addProperty('newProp', DeclarationVisibility.Private, 'myType');
            (await ctrl.commit()).should.be.true;

            document.lineAt(10).text.should.equal(`    private newProp: myType;`);
        });

        it('should add a new property to a class with properties', async () => {
            const ctrl = await ClassManager.create(document, 'ManagedClassWithProperties');

            ctrl.addProperty('newProp', DeclarationVisibility.Public, 'taip');
            (await ctrl.commit()).should.be.true;

            document.lineAt(23).text.should.equal(`    public newProp: taip;`);
        });

        it('should add a property to an empty class', async () => {
            const ctrl = await ClassManager.create(document, 'EmptyClass');

            ctrl.addProperty('newProp', DeclarationVisibility.Protected, 'number');
            (await ctrl.commit()).should.be.true;

            document.lineAt(46).text.should.equal(`    protected newProp: number;`);
        });

        it('should remove a property from a class', async () => {
            const ctrl = await ClassManager.create(document, 'ManagedClassWithProperties');

            document.lineAt(22).text.should.equal('    public foo: string;');
            ctrl.removeProperty('foo');
            (await ctrl.commit()).should.be.true;

            document.lineAt(22).text.should.equal('    protected bar: string;');
        });

        it('should add multiple properties to a class', async () => {
            const ctrl = await ClassManager.create(document, 'ManagedClassWithMethods');

            ctrl.addProperty('newProp', DeclarationVisibility.Protected, 'number')
                .addProperty('pubProp', DeclarationVisibility.Public, 'string');
            (await ctrl.commit()).should.be.true;

            document.lineAt(10).text.should.equal(`    public pubProp: string;`);
            document.lineAt(11).text.should.equal(`    protected newProp: number;`);
        });

        it('should add multiple properties to an empty class', async () => {
            const ctrl = await ClassManager.create(document, 'EmptyClass');

            ctrl.addProperty('newProp', DeclarationVisibility.Protected, 'number')
                .addProperty('pubProp', DeclarationVisibility.Public, 'string');
            (await ctrl.commit()).should.be.true;

            document.lineAt(46).text.should.equal(`    public pubProp: string;`);
            document.lineAt(47).text.should.equal(`    protected newProp: number;`);
        });

        it('should add a property in between properties', async () => {
            const ctrl = await ClassManager.create(document, 'ManagedClassWithProperties');

            ctrl.addProperty('newProp', DeclarationVisibility.Protected, 'number');
            (await ctrl.commit()).should.be.true;

            document.lineAt(23).text.should.equal(`    protected bar: string;`);
            document.lineAt(24).text.should.equal(`    protected newProp: number;`);
        });

        it('should add multiple properties in between properties', async () => {
            const ctrl = await ClassManager.create(document, 'ManagedClassWithProperties');

            ctrl.addProperty('protProp', DeclarationVisibility.Protected, 'number')
                .addProperty('pubProp', DeclarationVisibility.Public, 'number')
                .addProperty('privProp', DeclarationVisibility.Private, 'number');
            (await ctrl.commit()).should.be.true;

            document.lineAt(22).text.should.equal(`    public foo: string;`);
            document.lineAt(23).text.should.equal(`    public pubProp: number;`);
            document.lineAt(24).text.should.equal(`    protected bar: string;`);
            document.lineAt(25).text.should.equal(`    protected protProp: number;`);
            document.lineAt(26).text.should.equal(`    private baz: string;`);
            document.lineAt(27).text.should.equal(`    private privProp: number;`);
        });

        it('should remove multiple properties from a class', async () => {
            const ctrl = await ClassManager.create(document, 'ManagedClassWithProperties');

            ctrl.removeProperty('foo').removeProperty('baz');
            (await ctrl.commit()).should.be.true;

            document.lineAt(21).text.should.equal(`class ManagedClassWithProperties {`);
            document.lineAt(22).text.should.equal(`    protected bar: string;`);
            document.lineAt(23).text.should.equal(`}`);
        });

        it('should remove multiple properties to reach an empty class', async () => {
            const ctrl = await ClassManager.create(document, 'ManagedClassWithProperties');

            ctrl.removeProperty('foo')
                .removeProperty('bar')
                .removeProperty('baz');
            (await ctrl.commit()).should.be.true;

            document.lineAt(21).text.should.equal(`class ManagedClassWithProperties {`);
            document.lineAt(22).text.should.equal(`}`);
        });

        it('should remove one and add one property', async () => {
            const ctrl = await ClassManager.create(document, 'ManagedClassWithProperties');

            ctrl.removeProperty('foo')
                .addProperty('fooReplace', DeclarationVisibility.Public, 'type');
            (await ctrl.commit()).should.be.true;

            document.lineAt(22).text.should.equal(`    public fooReplace: type;`);
        });

        it('should add a method to a class with methods', async () => {
            const ctrl = await ClassManager.create(document, 'ManagedClassWithMethods');

            ctrl.addMethod(
                'newMethod',
                DeclarationVisibility.Private,
                'type',
                [
                    new ParameterDeclaration('foo', undefined),
                    new ParameterDeclaration('bar', 'baz'),
                ],
            );
            (await ctrl.commit()).should.be.true;

            document.lineAt(20).text.should.equal(`    private newMethod(foo, bar: baz): type {`);
            document.lineAt(21).text.should.equal(`        throw new Error('Not implemented yet.');`);
            document.lineAt(22).text.should.equal(`    }`);
        });

        it('should add a method to a class without methods', async () => {
            const ctrl = await ClassManager.create(document, 'ManagedClassWithProperties');

            ctrl.addMethod(
                'newMethod',
                DeclarationVisibility.Private,
                'type',
                [
                    new ParameterDeclaration('foo', undefined),
                    new ParameterDeclaration('bar', 'baz'),
                ],
            );
            (await ctrl.commit()).should.be.true;

            document.lineAt(26).text.should.equal(`    private newMethod(foo, bar: baz): type {`);
            document.lineAt(27).text.should.equal(`        throw new Error('Not implemented yet.');`);
            document.lineAt(28).text.should.equal(`    }`);
        });

        it('should remove a method from a class', async () => {
            const ctrl = await ClassManager.create(document, 'ManagedClassWithMethods');

            ctrl.removeMethod('whatever');
            (await ctrl.commit()).should.be.true;

            document.lineAt(12).text.should.equal('    private ohyea(foo: string, bar: number): ManagedClass {');
        });

        it('should add multiple methods to a class', async () => {
            const ctrl = await ClassManager.create(document, 'ManagedClassWithMethods');

            ctrl.addMethod(
                'newMethod',
                DeclarationVisibility.Private,
                'type',
                [
                    new ParameterDeclaration('foo', undefined),
                    new ParameterDeclaration('bar', 'baz'),
                ])
                .addMethod('protMethod', DeclarationVisibility.Protected, 'type');
            (await ctrl.commit()).should.be.true;

            document.lineAt(16).text.should.equal(`    protected protMethod(): type {`);
            document.lineAt(17).text.should.equal(`        throw new Error('Not implemented yet.');`);
            document.lineAt(18).text.should.equal(`    }`);

            document.lineAt(24).text.should.equal(`    private newMethod(foo, bar: baz): type {`);
            document.lineAt(25).text.should.equal(`        throw new Error('Not implemented yet.');`);
            document.lineAt(26).text.should.equal(`    }`);
        });

        it('should remove multiple methods from a class', async () => {
            const ctrl = await ClassManager.create(document, 'ManagedClassWithMethods');

            ctrl.removeMethod('whatever').removeMethod('method').removeMethod('ohyea');
            (await ctrl.commit()).should.be.true;

            document.lineAt(9).text.should.equal('class ManagedClassWithMethods {');
            document.lineAt(10).text.should.equal('}');
        });

        it('should add a property and a method to a class', async () => {
            const ctrl = await ClassManager.create(document, 'ManagedClassFull');

            ctrl.addProperty('newProperty', DeclarationVisibility.Public, 'FOOBAR')
                .addMethod('newMethod', DeclarationVisibility.Public);
            (await ctrl.commit()).should.be.true;

            document.lineAt(29).text.should.equal('    public newProperty: FOOBAR;');

            document.lineAt(37).text.should.equal(`    public newMethod() {`);
            document.lineAt(38).text.should.equal(`        throw new Error('Not implemented yet.');`);
            document.lineAt(39).text.should.equal(`    }`);
        });

        it('should remove a property and a method from a class', async () => {
            const ctrl = await ClassManager.create(document, 'ManagedClassFull');

            ctrl.removeProperty('bar')
                .removeMethod('whatever');
            (await ctrl.commit()).should.be.true;

            document.lineAt(29).text.should.not.equal('    protected bar: string;');

            document.lineAt(38).text.should.not.equal(`    protected whatever(): string {`);
        });

        it('should add multiple properties and methods to a class', async () => {
            const ctrl = await ClassManager.create(document, 'ManagedClassFull');

            ctrl.addProperty('newProperty', DeclarationVisibility.Public, 'FOOBAR')
                .addMethod('newMethod', DeclarationVisibility.Public)
                .addProperty('newProperty2', DeclarationVisibility.Public, 'FOOBAR')
                .addMethod('newMethod2', DeclarationVisibility.Public);
            (await ctrl.commit()).should.be.true;

            document.lineAt(29).text.should.equal('    public newProperty: FOOBAR;');
            document.lineAt(30).text.should.equal('    public newProperty2: FOOBAR;');

            document.lineAt(38).text.should.equal(`    public newMethod() {`);
            document.lineAt(39).text.should.equal(`        throw new Error('Not implemented yet.');`);
            document.lineAt(40).text.should.equal(`    }`);

            document.lineAt(42).text.should.equal(`    public newMethod2() {`);
            document.lineAt(43).text.should.equal(`        throw new Error('Not implemented yet.');`);
            document.lineAt(44).text.should.equal(`    }`);
        });

    });

});
