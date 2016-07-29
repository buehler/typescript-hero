import * as chai from 'chai';
import {TsResolveFileParser} from '../../src/parser/TsResolveFileParser';
import {TsStringImport, TsNamedImport, TsNamespaceImport, TsExternalModuleImport} from '../../src/models/TsImport';
import {TsResolveFile} from '../../src/models/TsResolveFile';
import {TsClassDeclaration, TsFunctionDeclaration, TsEnumDeclaration, TsVariableDeclaration, TsTypeDeclaration, TsInterfaceDeclaration} from '../../src/models/TsDeclaration';
import {TsAllFromExport, TsNamedFromExport} from '../../src/models/TsExport';
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

        describe('Declarations', () => {

            const file = path.join(__dirname, '../../../.test/resolveFileParser/declarationsOnly.ts');

            beforeEach(() => {
                parsed = parser.parseFile(file);
            });

            it('should parse exports', () => {
                parsed.declarations.should.be.an('array').with.lengthOf(12);
            });

            it('should parse class export', () => {
                parsed.declarations[0].should.be.an.instanceOf(TsClassDeclaration)
                    .with.property('name')
                    .that.equals('ExportedClass');
            });

            it('should parse function export', () => {
                parsed.declarations[1].should.be.an.instanceOf(TsFunctionDeclaration)
                    .with.property('name')
                    .that.equals('exportedFunction');
            });

            it('should parse enum export', () => {
                parsed.declarations[2].should.be.an.instanceOf(TsEnumDeclaration)
                    .with.property('name')
                    .that.equals('ExportedEnum');
            });

            it('should parse const enum export', () => {
                parsed.declarations[3].should.be.an.instanceOf(TsEnumDeclaration)
                    .with.property('name')
                    .that.equals('ExportedConstEnum');
            });

            it('should parse variable export', () => {
                parsed.declarations[4].should.be.an.instanceOf(TsVariableDeclaration);
                let tsExport = parsed.declarations[4] as TsVariableDeclaration;
                tsExport.name.should.equal('ExportedVariable');
                tsExport.isConst.should.be.false;
            });

            it('should parse constant export', () => {
                parsed.declarations[5].should.be.an.instanceOf(TsVariableDeclaration);
                let tsExport = parsed.declarations[5] as TsVariableDeclaration;
                tsExport.name.should.equal('ExportedConst');
                tsExport.isConst.should.be.true;
            });

            it('should parse let variable export', () => {
                parsed.declarations[6].should.be.an.instanceOf(TsVariableDeclaration);
                let tsExport = parsed.declarations[6] as TsVariableDeclaration;
                tsExport.name.should.equal('ExportedLet');
                tsExport.isConst.should.be.false;
            });

            it('should parse multiline variable export', () => {
                parsed.declarations[7].should.be.an.instanceOf(TsVariableDeclaration);
                parsed.declarations[8].should.be.an.instanceOf(TsVariableDeclaration);

                let tsExport = parsed.declarations[7] as TsVariableDeclaration;
                tsExport.name.should.equal('MultiLet1');
                tsExport.isConst.should.be.false;

                tsExport = parsed.declarations[8] as TsVariableDeclaration;
                tsExport.name.should.equal('MultiLet2');
                tsExport.isConst.should.be.false;
            });

            it('should parse type export', () => {
                parsed.declarations[9].should.be.an.instanceOf(TsTypeDeclaration)
                    .with.property('name')
                    .that.equals('ExportedType');
            });

            it('should parse interface export', () => {
                parsed.declarations[10].should.be.an.instanceOf(TsInterfaceDeclaration)
                    .with.property('name')
                    .that.equals('ExportedInterface');
            });

            it('should parse non exported class', () => {
                parsed.declarations[11].should.be.an.instanceOf(TsClassDeclaration)
                    .with.property('name')
                    .that.equals('NotExported');
            });

        });

        describe('Exports', () => {

            const file = path.join(__dirname, '../../../.test/resolveFileParser/exportsOnly.ts');

            beforeEach(() => {
                parsed = parser.parseFile(file);
            });

            it('should parse export all from another file', () => {
                parsed.exports[0].should.be.an.instanceOf(TsAllFromExport)
                    .with.property('from')
                    .that.equals('./OtherFile');
            });

            it('should parse export named from another file', () => {
                parsed.exports[1].should.be.an.instanceOf(TsNamedFromExport)
                    .with.property('from')
                    .that.equals('./AnotherFile');
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
                    'AssignmentToVariable',
                    'console',
                    'a',
                    'b']);
            });

            it('should parse corret nonlocal usages', () => {
                parsed.nonLocalUsages.should.be.an('array').that.deep.equals([
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
                    'AssignmentToVariable',
                    'console']);
            });

        });

    });

});
