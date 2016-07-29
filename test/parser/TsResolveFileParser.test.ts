import * as chai from 'chai';
import {TsResolveFileParser} from '../../src/parser/TsResolveFileParser';
import {TsStringImport, TsNamedImport, TsNamespaceImport, TsExternalModuleImport} from '../../src/models/TsImport';
import {TsResolveFile} from '../../src/models/TsResolveFile';
import {TsNamedExport, TsClassExport, TsFunctionExport, TsEnumExport, TsVariableExport, TsTypeExport, TsInterfaceExport, TsAllFromExport, TsNamedFromExport} from '../../src/models/TsExport';
import path = require('path');

chai.should();

describe('TsResolveFileParser', () => {

    let parser: TsResolveFileParser,
        parsed: TsResolveFile;

    beforeEach(() => {
        parser = new TsResolveFileParser();
    });

    describe('Local typescript files', () => {

        describe('Imports', () => {

            const file = path.join(__dirname, '../../../.test/resolveFileParser/importsOnly.ts');

            beforeEach(() => {
                parsed = parser.parseFile(file);
            });

            it('should parse imports', () => {
                parsed.imports.should.be.an('array').with.lengthOf(6);
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
                tsImport.specifiers.should.deep.equal([
                    { specifier: 'Specifier1', alias: undefined },
                    { specifier: 'Specifier2', alias: undefined },
                    { specifier: 'Specifier3', alias: undefined }
                ]);
            });

            it('should parse named import with aliased specifier', () => {
                let tsImport = parsed.imports[2] as TsNamedImport;

                tsImport.should.be.an.instanceOf(TsNamedImport);
                tsImport.libraryName.should.equal('namedAliasedImport');
                tsImport.specifiers.should.deep.equal([{ specifier: 'Specifier1', alias: 'Alias1' }]);
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
                tsImport.specifiers.should.deep.equal([
                    { specifier: 'Spec1', alias: undefined },
                    { specifier: 'Spec2', alias: 'Alias2' }
                ]);
            });

        });

        describe('Exports', () => {

            const file = path.join(__dirname, '../../../.test/resolveFileParser/exportsOnly.ts');

            beforeEach(() => {
                parsed = parser.parseFile(file);
            });

            it('should parse exports', () => {
                parsed.exports.should.be.an('array').with.lengthOf(13);
            });

            it('should parse class export', () => {
                parsed.exports[0].should.be.an.instanceOf(TsClassExport)
                    .with.property('name')
                    .that.equals('ExportedClass');
            });

            it('should parse function export', () => {
                parsed.exports[1].should.be.an.instanceOf(TsFunctionExport)
                    .with.property('name')
                    .that.equals('exportedFunction');
            });

            it('should parse enum export', () => {
                parsed.exports[2].should.be.an.instanceOf(TsEnumExport)
                    .with.property('name')
                    .that.equals('ExportedEnum');
            });

            it('should parse const enum export', () => {
                parsed.exports[3].should.be.an.instanceOf(TsEnumExport)
                    .with.property('name')
                    .that.equals('ExportedConstEnum');
            });

            it('should parse variable export', () => {
                parsed.exports[4].should.be.an.instanceOf(TsVariableExport)
                    .that.deep.equals({ name: 'ExportedVariable', isConst: false });
            });

            it('should parse constant export', () => {
                parsed.exports[5].should.be.an.instanceOf(TsVariableExport)
                    .that.deep.equals({ name: 'ExportedConst', isConst: true });
            });

            it('should parse let variable export', () => {
                parsed.exports[6].should.be.an.instanceOf(TsVariableExport)
                    .that.deep.equals({ name: 'ExportedLet', isConst: false });
            });

            it('should parse multiline variable export', () => {
                parsed.exports[7].should.be.an.instanceOf(TsVariableExport)
                    .that.deep.equals({ name: 'MultiLet1', isConst: false });

                parsed.exports[8].should.be.an.instanceOf(TsVariableExport)
                    .that.deep.equals({ name: 'MultiLet2', isConst: false });
            });

            it('should parse type export', () => {
                parsed.exports[9].should.be.an.instanceOf(TsTypeExport)
                    .with.property('name')
                    .that.equals('ExportedType');
            });

            it('should parse interface export', () => {
                parsed.exports[10].should.be.an.instanceOf(TsInterfaceExport)
                    .with.property('name')
                    .that.equals('ExportedInterface');
            });

            it('should not parse non exported class', () => {
                parsed.exports.some(o => o instanceof TsNamedExport && o.name === 'NotExported').should.be.false;
            });

            it('should parse export all from another file', () => {
                parsed.exports[11].should.be.an.instanceOf(TsAllFromExport)
                    .with.property('from')
                    .that.equals('./OtherFile');
            });

            it('should parse export named from another file', () => {
                parsed.exports[12].should.be.an.instanceOf(TsNamedFromExport)
                    .that.deep.equals({
                        from: './AnotherFile',
                        specifiers: [
                            { specifier: 'Specifier', alias: undefined },
                            { specifier: 'Specifier', alias: 'Alias' }
                        ]
                    });
            });

        });

        describe('Usages', () => {

            const file = path.join(__dirname, '../../../.test/resolveFileParser/usagesOnly.ts');

            beforeEach(() => {
                parsed = parser.parseFile(file);
            });

            it('should parse usages', () => {
                parsed.usages.should.be.an('array').that.deep.equals([
                    'ClassDecorator',
                    'PropertyDecorator',
                    'TypedPropertyRef',
                    'AssignedProperty',
                    'FunctionDecorator',
                    'TypedParam',
                    'DefaultParam',
                    'ReturnValue',
                    'PropertyAccess',
                    'functionCall',
                    'MyProperty',
                    'Indexing',
                    'AssignmentToVariable'
                ]);
            })

        });

    });

});
