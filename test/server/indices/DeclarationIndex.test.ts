import 'reflect-metadata';
import { ClassDeclaration, FunctionDeclaration } from '../../../src/common/ts-parsing/declarations';
import { findFiles } from '../../../src/extension/extensions/ImportResolveExtension';
import { VscodeExtensionConfig } from '../../../src/extension/VscodeExtensionConfig';
import { DeclarationIndex } from '../../../src/server/indices/DeclarationIndex';
import { Container } from '../../../src/server/IoC';
import * as chai from 'chai';
import * as vscode from 'vscode';

const should = chai.should();

describe('DeclarationIndex', () => {

    let declarationIndex: DeclarationIndex,
        files: string[];

    before(async () => {
        const config = new VscodeExtensionConfig();
        declarationIndex = Container.get(DeclarationIndex);
        files = await findFiles(config);

    });

    beforeEach(() => {
        declarationIndex.reset();
    });

    it('should not process a circular export cycle', async () => {
        await declarationIndex.buildIndex(files, vscode.workspace.rootPath);
    });

    it('should resolve the build process', async () => {
        await declarationIndex.buildIndex(files, vscode.workspace.rootPath);
    });

    it('should not have an index ready without build', () => {
        declarationIndex.indexReady.should.be.false;
    });

    it('should have an index ready after build', async () => {
        await declarationIndex.buildIndex(files, vscode.workspace.rootPath);
        declarationIndex.indexReady.should.be.true;

    });

    describe('buildIndex()', () => {

        beforeEach(async () => {
            await declarationIndex.buildIndex(files, vscode.workspace.rootPath);

        });

        it('should contain certain parsedResources', () => {
            let idx: any = declarationIndex,
                resources = Object.assign({}, idx.parsedResources);
            resources.should.contain.any.key('body-parser');
            resources.should.contain.any.key('fancy-library');
            resources.should.contain.any.key('NodeJS');
            resources.should.contain.any.key('/server/indices/index');
            resources.should.contain.any.key('/server/indices/MyClass');
        });

        it('should contain declarations with names', () => {
            let list = declarationIndex.index!['isString'];
            list.should.be.an('array').with.lengthOf(2);

            list[0].from.should.equal('/server/indices/HelperFunctions');
            list[0].declaration.should.be.an.instanceof(FunctionDeclaration);
        });

        it('should contain a declaration name with multiple declarations', () => {

            let list = declarationIndex.index!['FancierLibraryClass'];
            list.should.be.an('array').with.lengthOf(2);

            list[0].from.should.equal('/server/indices');
            list[0].declaration.should.be.an.instanceof(ClassDeclaration);
            list[1].from.should.equal('fancy-library/FancierLibraryClass');
            list[1].declaration.should.be.an.instanceof(ClassDeclaration);
        });

        it('should not contain a duplicate declaration (overloaded declarations)', () => {
            let list = declarationIndex.index!['execFile'];
            list.should.be.an('array').with.lengthOf(1);
            list[0].from.should.equal('child_process');
        });

        it('should export * as correctly', () => {
            let idx: any = declarationIndex,
                resources = Object.assign({}, idx.parsedResources);
            resources['/server/indices/MyClass'].declarations.length.should.equal(0);
            resources['/server/indices/index'].declarations[0].name.should.equal('MyClass');
            resources['/server/indices/index'].declarations[1].name.should.equal('FancierLibraryClass');
        });

        it('should export an alias correctly', () => {
            let idx: any = declarationIndex,
                resources = Object.assign({}, idx.parsedResources);
            resources['/server/indices/SpecialExports'].declarations.length.should.equal(0);
            resources['/server/indices/index'].declarations[11].name.should.equal('ExportAlias');
        });

        it('should not contain items from the build directory', () => {
            let idx: any = declarationIndex,
                resources = Object.assign({}, idx.parsedResources);
            resources.should.not.contain.any.key('/build/app');
        });

        it('should contain declaration from *.tsx file', () => {
            let idx: any = declarationIndex,
                resources = Object.assign({}, idx.parsedResources);
            resources['/server/indices/MyReactTemplate'].declarations.length.should.equal(1);
            resources['/server/indices/MyReactTemplate'].declarations[0].name.should.equal('myComponent');
        });

        it('should not filter node_modules / typings by pattern', () => {
            let list = declarationIndex.index!['NestedDistDeclaration'];
            list.should.be.an('array').with.lengthOf(1);
            list[0].from.should.equal('some-lib/dist/SomeDeclaration');
        });

        it('should not contain filtered directories', () => {
            let list = declarationIndex.index!['MyCompiledClass'];
            should.not.exist(list);
        });

        it('should not crash on prototype methods (i.e. toString, hasOwnProperty)', () => {
            let list = declarationIndex.index!['toString'];
            list.should.be.an('array').with.lengthOf(1);
            list[0].from.should.equal('/server/indices/proto');

            let list2 = declarationIndex.index!['hasOwnProperty'];
            list2.should.be.an('array').with.lengthOf(1);
            list2[0].from.should.equal('/server/indices/proto');
        });

    });

});
