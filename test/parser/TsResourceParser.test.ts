import 'reflect-metadata';
import {TsDefaultImport, TsExternalModuleImport, TsNamedImport, TsNamespaceImport, TsStringImport} from '../../src/models/TsImport';
import {TsResource} from '../../src/models/TsResource';
import {TsResourceParser} from '../../src/parser/TsResourceParser';
import * as chai from 'chai';
import {join} from 'path';

chai.should();

describe('TsResourceParser', () => {

    let parser: TsResourceParser,
        parsed: TsResource;

    beforeEach(() => {
        parser = new TsResourceParser(() => {
            return <any>{
                info: () => { },
                error: () => { },
                warning: () => { }
            };
        });
    });

    describe('Imports', () => {

        const file = join(process.cwd(), '.test/resolveFileParser/importsOnly.ts');

        beforeEach(() => {
            return parser.parseFile(<any>{fsPath: file}).then(file => parsed = file);
        });

        it('should parse imports', () => {
            parsed.imports.should.be.an('array').with.lengthOf(7);
        });

        it('should parse string import', () => {
            parsed.imports[0].should.be
                .an.instanceOf(TsStringImport)
                .with.property('libraryName').that.equals('stringImport');
        });

        it('should parse named import', () => {
            let tsImport = parsed.imports[1] as TsNamedImport;

            tsImport.should.be.an.instanceOf(TsNamedImport);
            tsImport.libraryName.should.equal('namedImport');
            tsImport.specifiers[0].specifier.should.equal('Specifier1');
            tsImport.specifiers[1].specifier.should.equal('Specifier2');
            tsImport.specifiers[2].specifier.should.equal('Specifier3');
        });

        it('should parse named import with aliased specifier', () => {
            let tsImport = parsed.imports[2] as TsNamedImport;

            tsImport.should.be.an.instanceOf(TsNamedImport);
            tsImport.libraryName.should.equal('namedAliasedImport');
            tsImport.specifiers[0].specifier.should.equal('Specifier1');
            tsImport.specifiers[0].alias.should.equal('Alias1');
        });

        it('should parse namespace import', () => {
            let tsImport = parsed.imports[3] as TsNamespaceImport;

            tsImport.should.be.an.instanceOf(TsNamespaceImport);
            tsImport.libraryName.should.equal('namespace');
            tsImport.alias.should.equal('namespaceImport');
        });

        it('should parse external module import', () => {
            let tsImport = parsed.imports[4] as TsExternalModuleImport;

            tsImport.should.be.an.instanceOf(TsExternalModuleImport);
            tsImport.libraryName.should.equal('externalModule');
            tsImport.alias.should.equal('external');
        });

        it('should parse a multiline import', () => {
            let tsImport = parsed.imports[5] as TsNamedImport;

            tsImport.should.be.an.instanceOf(TsNamedImport);
            tsImport.libraryName.should.equal('multiLineImport');
            tsImport.specifiers[0].specifier.should.equal('Spec1');
            tsImport.specifiers[1].specifier.should.equal('Spec2');
            tsImport.specifiers[1].alias.should.equal('Alias2');
        });

        it('should parse a default import', () => {
            let tsImport = parsed.imports[6] as TsDefaultImport;

            tsImport.should.be.an.instanceOf(TsDefaultImport);
            tsImport.libraryName.should.equal('aFile');
            tsImport.alias.should.equal('Foobar');
        });

    });

});
