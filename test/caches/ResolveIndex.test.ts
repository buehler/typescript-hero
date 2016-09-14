import 'reflect-metadata';
import {ResolveIndex} from '../../src/caches/ResolveIndex';
import {Injector} from '../../src/IoC';
import {ClassDeclaration, FunctionDeclaration} from '../../src/models/TsDeclaration';
import * as chai from 'chai';

chai.should();

describe('ResolveIndex', () => {

    let resolveIndex: ResolveIndex;

    before(() => {
        resolveIndex = Injector.get(ResolveIndex);
    });

    beforeEach(() => {
        resolveIndex.reset();
    });

    it('should resolve the build process', done => {
        resolveIndex.buildIndex().then(done).catch(done);
    });

    it('should not have an index ready without build', () => {
        resolveIndex.indexReady.should.be.false;
    });

    it('should have an index ready after build', done => {
        resolveIndex.buildIndex()
            .then(() => {
                resolveIndex.indexReady.should.be.true;
                done();
            })
            .catch(done);
    });

    describe('buildIndex()', () => {

        beforeEach(() => resolveIndex.buildIndex());

        it('should contain certain parsedResources', () => {
            let idx: any = resolveIndex,
                resources = idx.parsedResources;
            resources.should.contain.any.key('body-parser');
            resources.should.contain.any.key('fancy-library');
            resources.should.contain.any.key('/resourceIndex/index');
            resources.should.contain.any.key('/resourceIndex/MyClass');
        });

        it('should contain declarations with names', () => {
            let list = resolveIndex.index['isString'];
            list.should.be.an('array').with.lengthOf(1);

            list[0].from.should.equal('/resourceIndex/HelperFunctions');
            list[0].declaration.should.be.an.instanceof(FunctionDeclaration);
        });

        it('should contain a declaration name with multiple declarations', () => {
            let list = resolveIndex.index['FancierLibraryClass'];
            list.should.be.an('array').with.lengthOf(2);

            list[0].from.should.equal('/resourceIndex/index');
            list[0].declaration.should.be.an.instanceof(ClassDeclaration);
            list[1].from.should.equal('fancy-library/FancierLibraryClass');
            list[1].declaration.should.be.an.instanceof(ClassDeclaration);
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
            resources['/resourceIndex/index'].declarations[2].name.should.equal('ExportAlias');
        });

    });

});
