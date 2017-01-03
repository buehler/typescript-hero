import 'reflect-metadata';
import { ResolveIndex } from '../../src/caches/ResolveIndex';
import { Injector } from '../../src/IoC';
import { ClassDeclaration, FunctionDeclaration } from '../../src/models/TsDeclaration';
import * as chai from 'chai';

let should = chai.should();

describe('ResolveIndex', () => {

    let resolveIndex: ResolveIndex;

    before(() => {
        resolveIndex = Injector.get(ResolveIndex);
    });

    beforeEach(() => {
        resolveIndex.reset();
    });

    it('should not process a circular export cycle', async done => {
        try {
            await resolveIndex.buildIndex();
            done();
        } catch (e) {
            done(e);
        }
    });

    it('should resolve the build process', async done => {
        try {
            await resolveIndex.buildIndex();
            done();
        } catch (e) {
            done(e);
        }
    });

    it('should not have an index ready without build', () => {
        resolveIndex.indexReady.should.be.false;
    });

    it('should have an index ready after build', async done => {
        await resolveIndex.buildIndex();
        resolveIndex.indexReady.should.be.true;
        done();
    });

    describe('buildIndex()', () => {

        beforeEach(async done => {
            await resolveIndex.buildIndex();
            done();
        });

        it('should contain certain parsedResources', () => {
            let idx: any = resolveIndex,
                resources = idx.parsedResources;
            resources.should.contain.any.key('body-parser');
            resources.should.contain.any.key('fancy-library');
            resources.should.contain.any.key('NodeJS');
            resources.should.contain.any.key('/resourceIndex/index');
            resources.should.contain.any.key('/resourceIndex/MyClass');
        });

        it('should contain declarations with names', () => {
            let list = resolveIndex.index['isString'];
            list.should.be.an('array').with.lengthOf(2);

            list[0].from.should.equal('/resourceIndex/HelperFunctions');
            list[0].declaration.should.be.an.instanceof(FunctionDeclaration);
        });

        it('should contain a declaration name with multiple declarations', () => {
            let list = resolveIndex.index['FancierLibraryClass'];
            list.should.be.an('array').with.lengthOf(2);

            list[0].from.should.equal('/resourceIndex');
            list[0].declaration.should.be.an.instanceof(ClassDeclaration);
            list[1].from.should.equal('fancy-library/FancierLibraryClass');
            list[1].declaration.should.be.an.instanceof(ClassDeclaration);
        });

        it('should not contain a duplicate declaration (overloaded declarations)', () => {
            let list = resolveIndex.index['execFile'];
            list.should.be.an('array').with.lengthOf(1);
            list[0].from.should.equal('child_process');
        });

        it('should export * as correctly', () => {
            let idx: any = resolveIndex,
                resources = idx.parsedResources;
            resources['/resourceIndex/MyClass'].declarations.length.should.equal(0);
            resources['/resourceIndex/index'].declarations[0].name.should.equal('MyClass');
            resources['/resourceIndex/index'].declarations[1].name.should.equal('FancierLibraryClass');
        });

        it('should export an alias correctly', () => {
            let idx: any = resolveIndex,
                resources = idx.parsedResources;
            resources['/resourceIndex/SpecialExports'].declarations.length.should.equal(0);
            resources['/resourceIndex/index'].declarations[11].name.should.equal('ExportAlias');
        });

        it('should not contain items from the build directory', () => {
            let idx: any = resolveIndex,
                resources = idx.parsedResources;
            resources.should.not.contain.any.key('/build/app');
        });

        it('should contain declaration from *.tsx file', () => {
            let idx: any = resolveIndex,
                resources = idx.parsedResources;
            resources['/MyReactTemplate'].declarations.length.should.equal(1);
            resources['/MyReactTemplate'].declarations[0].name.should.equal('myComponent');
        });

        it('should not filter node_modules / typings by pattern', () => {
            let list = resolveIndex.index['NestedDistDeclaration'];
            list.should.be.an('array').with.lengthOf(1);
            list[0].from.should.equal('some-lib/dist/SomeDeclaration');
        });

        it('should not contain filtered directories', () => {
            let list = resolveIndex.index['MyCompiledClass'];
            should.not.exist(list);
        });

        it('should not crash on prototype methods (i.e. toString, hasOwnProperty)', () => {
            let list = resolveIndex.index['toString'];
            list.should.be.an('array').with.lengthOf(1);
            list[0].from.should.equal('/prototypeFunctions/proto');

            let list2 = resolveIndex.index['hasOwnProperty'];
            list2.should.be.an('array').with.lengthOf(1);
            list2[0].from.should.equal('/prototypeFunctions/proto');
        });

    });

});
