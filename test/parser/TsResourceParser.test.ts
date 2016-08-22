import 'reflect-metadata';
import {EnumDeclaration} from '../../src/models/TsDeclaration';
import {TsAllFromExport, TsAssignedExport, TsDefaultExport, TsNamedFromExport} from '../../src/models/TsExport';
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

        const file = join(process.cwd(), '.test/resourceParser/importsOnly.ts');

        beforeEach(() => {
            return parser.parseFile(<any>{ fsPath: file }).then(file => parsed = file);
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

    describe('Exports', () => {

        const file = join(process.cwd(), '.test/resourceParser/exportsOnly.ts');

        beforeEach(() => {
            return parser.parseFile(<any>{ fsPath: file }).then(file => parsed = file);
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

        it('should parse export assignment', () => {
            parsed.exports[2].should.be.an.instanceOf(TsAssignedExport)
                .with.property('declarationIdentifier')
                .that.equals('Foo');
        });

        it('should parse default export', () => {
            parsed.exports[3].should.be.an.instanceOf(TsDefaultExport);
        });

    });

    describe('Declarations', () => {

        describe('Enums', () => {

            const file = join(process.cwd(), '.test/resourceParser/enum.ts');

            beforeEach(() => {
                return parser.parseFile(<any>{ fsPath: file }).then(file => parsed = file);
            });

            it('should parse a file', () => {
                parsed.declarations.should.be.an('array').with.lengthOf(2);
            });

            it('should parse an enum correctly', () => {
                let parsedEnum = parsed.declarations[0] as EnumDeclaration;
                parsedEnum.isExported.should.be.false;
                parsedEnum.name.should.equal('Enumeration');
                parsedEnum.members.should.be.an('array').with.lengthOf(3);
                parsedEnum.members[0].should.equal('Member1');
            });

            it('should parse an exported enum correctly', () => {
                let parsedEnum = parsed.declarations[1] as EnumDeclaration;
                parsedEnum.isExported.should.be.true;
                parsedEnum.name.should.equal('ConstantEnumeration');
                parsedEnum.members.should.be.an('array').with.lengthOf(2);
                parsedEnum.members[0].should.equal('ConstMember1');
            });

        });

    });

});
