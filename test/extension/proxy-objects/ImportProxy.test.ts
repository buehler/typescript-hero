import * as chai from 'chai';
import { given } from 'mocha-testdata';
import {
    DefaultImport,
    NamedImport,
    SymbolSpecifier,
    TypescriptCodeGenerator,
    TypescriptGenerationOptions,
} from 'typescript-parser';

import { ImportProxy } from '../../../src/extension/proxy-objects/ImportProxy';

chai.should();

describe('ImportProxy', () => {

    describe('constructor()', () => {

        it('should create a descendent of a TsNamedImport', () => {
            const proxy = new ImportProxy('foo');

            proxy.should.be.an.instanceof(ImportProxy);
            proxy.libraryName.should.equal('foo');
        });

        it('should use the values of a given TsNamedImport', () => {
            const imp = new NamedImport('foo', 42, 1337);
            const proxy = new ImportProxy(imp);

            proxy.libraryName.should.equal(imp.libraryName);
            proxy.start!.should.equal(imp.start);
            proxy.end!.should.equal(imp.end);
        });

        it('should duplicate the specifiers of a TsNamedImport', () => {
            const imp = new NamedImport('foo');
            imp.specifiers.push(new SymbolSpecifier('bar'));

            const proxy = new ImportProxy(imp);
            proxy.specifiers.should.be.an('array').with.lengthOf(1);
            proxy.specifiers[0].specifier.should.equal('bar');
        });

        it('should add a default alias from a TsDefaultImport', () => {
            const imp = new DefaultImport('foo', 'ALIAS');
            const proxy = new ImportProxy(imp);

            proxy.defaultAlias!.should.equal('ALIAS');
        });

    });

    describe('addSpecifier()', () => {

        let proxy: ImportProxy;

        beforeEach(() => {
            proxy = new ImportProxy('foo');
        });

        it('should add a specifier to the list', () => {
            proxy.addSpecifier('bar');
            proxy.specifiers.should.have.lengthOf(1);
            proxy.specifiers[0].specifier.should.equal('bar');
        });

        it('should not add a specifier if it already exists', () => {
            proxy.addSpecifier('bar');
            proxy.specifiers.should.have.lengthOf(1);
            proxy.addSpecifier('bar');
            proxy.specifiers.should.have.lengthOf(1);
        });

    });

    describe('clone()', () => {

        it('should clone the whole ImportProxy element', () => {
            const p1 = new ImportProxy('foo');
            p1.addSpecifier('bar');
            p1.defaultAlias = 'ALIAS';

            const p2 = p1.clone();

            (p1.isEqual(p2)).should.be.true;
        });

    });

    describe('isEqual()', () => {

        it('should return true if another proxy is equal', () => {
            const p1 = new ImportProxy('foo');
            const p2 = new ImportProxy('foo');

            p1.addSpecifier('bar');
            p2.addSpecifier('bar');

            p1.addSpecifier('baz');
            p2.addSpecifier('baz');

            (p1.isEqual(p2)).should.be.true;
        });

        given(
            {
                description: 'foo vs bar',
                p1: new ImportProxy('foo'),
                p2: new ImportProxy('bar'),
            },
            {
                description: 'foo with different alias',
                p1: (() => {
                    const p = new ImportProxy('foo');
                    p.defaultAlias = 'ALIAS';
                    return p;
                })(),
                p2: (() => {
                    const p = new ImportProxy('foo');
                    p.defaultAlias = 'ALIAS_2';
                    return p;
                })(),
            },
            {
                description: 'foo with different default export',
                p1: (() => {
                    const p = new ImportProxy('foo');
                    p.defaultPurposal = 'MyDefaultExport';
                    return p;
                })(),
                p2: (() => {
                    const p = new ImportProxy('foo');
                    p.defaultPurposal = 'MyDefaultExport_2';
                    return p;
                })(),
            },
            {
                description: 'foo with different specifiers count',
                p1: (() => {
                    const p = new ImportProxy('foo');
                    p.addSpecifier('bar');
                    p.addSpecifier('baz');
                    return p;
                })(),
                p2: (() => {
                    const p = new ImportProxy('foo');
                    p.addSpecifier('bar');
                    return p;
                })(),
            },
            {
                description: 'foo with different specifiers',
                p1: (() => {
                    const p = new ImportProxy('foo');
                    p.addSpecifier('baz');
                    return p;
                })(),
                p2: (() => {
                    const p = new ImportProxy('foo');
                    p.addSpecifier('bar');
                    return p;
                })(),
            },
        ).it('should return false if another proxy is not equal', ({ p1, p2 }) => {
            (p1.isEqual(p2)).should.be.false;
        });

    });

    describe('toImport()', () => {

        let generator: TypescriptCodeGenerator;

        const options: TypescriptGenerationOptions = {
            eol: ';',
            multiLineWrapThreshold: 120,
            multiLineTrailingComma: false,
            stringQuoteStyle: `'`,
            spaceBraces: true,
            tabSize: 4,
        };
        let proxy: ImportProxy;

        beforeEach(() => {
            generator = new TypescriptCodeGenerator(options);
            proxy = new ImportProxy('foo');
        });

        it('should generate a TsDefaultImport when no specifiers are provided', () => {
            proxy.defaultAlias = 'ALIAS';
            generator.generate(proxy).should.equal(`import ALIAS from 'foo';`);
        });

        it('should generate a normal TsNamedImport when no default import is provided', () => {
            proxy.addSpecifier('bar');
            proxy.addSpecifier('baz');
            generator.generate(proxy).should.equal(`import { bar, baz } from 'foo';`);
        });

        it('should generate a normal TsNamedImport with aliases when no default import is provided', () => {
            proxy.addSpecifier('bar');
            proxy.specifiers.push(new SymbolSpecifier('baz', 'blub'));
            generator.generate(proxy).should.equal(`import { bar, baz as blub } from 'foo';`);
        });

        it('should generate a TsNamedImport with default import', () => {
            proxy.defaultAlias = 'ALIAS';
            proxy.addSpecifier('bar');
            generator.generate(proxy).should.equal(`import { bar, default as ALIAS } from 'foo';`);
        });

        it.skip('should omit semicolons if configured', () => {
            const optionsClone = Object.assign({}, options);
            optionsClone.eol = '';
            generator = new TypescriptCodeGenerator(optionsClone);
            proxy.defaultAlias = 'ALIAS';
            generator.generate(proxy).should.equal(`import ALIAS from 'foo'`);
        });

    });

});
