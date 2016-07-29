import * as chai from 'chai';
import {TsResolveFileParser} from '../../src/parser/TsResolveFileParser';
import {TsStringImport, TsNamedImport, TsNamespaceImport, TsExternalModuleImport} from '../../src/models/TsImport';
import path = require('path');

chai.should();

describe('TsResolveFileParser', () => {

    let parser: TsResolveFileParser;

    beforeEach(() => {
        parser = new TsResolveFileParser();
    });

    describe('Local typescript files', () => {

        describe('Imports', () => {

            const file = path.join(__dirname, '../../../test/etc/resolveFileParser/importsOnly.ts');

            it('should parse imports correctly', () => {
                let parsed = parser.parseFile(file);
                parsed.imports.should.be.an('array').with.lengthOf(6);
            });

            it('should parse string import correctly', () => {
                let parsed = parser.parseFile(file);
                parsed.imports[0].should.be
                    .an.instanceOf(TsStringImport)
                    .with.property('libraryName').that.equals('stringImport');
            });

            it('should parse named import correctly', () => {
                let parsed = parser.parseFile(file);
                let tsImport = parsed.imports[1] as TsNamedImport;

                tsImport.should.be.an.instanceOf(TsNamedImport);
                tsImport.libraryName.should.equal('namedImport');
                tsImport.specifiers.should.deep.equal([
                    { specifier: 'Specifier1', alias: undefined },
                    { specifier: 'Specifier2', alias: undefined },
                    { specifier: 'Specifier3', alias: undefined }
                ]);
            });

            it('should parse named import with aliased specifier correctly', () => {
                let parsed = parser.parseFile(file);
                let tsImport = parsed.imports[2] as TsNamedImport;

                tsImport.should.be.an.instanceOf(TsNamedImport);
                tsImport.libraryName.should.equal('namedAliasedImport');
                tsImport.specifiers.should.deep.equal([{ specifier: 'Specifier1', alias: 'Alias1' }]);
            });

            it('should parse namespace import correctly', () => {
                let parsed = parser.parseFile(file);
                let tsImport = parsed.imports[3] as TsNamespaceImport;

                tsImport.should.be.an.instanceOf(TsNamespaceImport);
                tsImport.libraryName.should.equal('namespace');
                tsImport.alias.should.equal('namespaceImport');
            });

            it('should parse external module import correctly', () => {
                let parsed = parser.parseFile(file);
                let tsImport = parsed.imports[4] as TsExternalModuleImport;

                tsImport.should.be.an.instanceOf(TsExternalModuleImport);
                tsImport.libraryName.should.equal('externalModule');
                tsImport.alias.should.equal('external');
            });

            it('should parse a multiline import correctly', () => {
                let parsed = parser.parseFile(file);
                let tsImport = parsed.imports[5] as TsNamedImport;

                tsImport.should.be.an.instanceOf(TsNamedImport);
                tsImport.libraryName.should.equal('multiLineImport');
                tsImport.specifiers.should.deep.equal([
                    { specifier: 'Spec1', alias: undefined },
                    { specifier: 'Spec2', alias: 'Alias2' }
                ]);
            });

        });

        describe('Exports', () => {



        });

        describe('Usages', () => {



        });

        describe('Full file', () => {



        });

    });

});
