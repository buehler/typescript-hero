import 'reflect-metadata';
import {EnumDeclaration, FunctionDeclaration, TypeAliasDeclaration, VariableDeclaration} from '../../src/models/TsDeclaration';
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

        describe('Type aliases', () => {

            const file = join(process.cwd(), '.test/resourceParser/typeAlias.ts');

            beforeEach(() => {
                return parser.parseFile(<any>{ fsPath: file }).then(file => parsed = file);
            });

            it('should parse a file', () => {
                parsed.declarations.should.be.an('array').with.lengthOf(2);
            });

            it('should parse a type alias correctly', () => {
                let parsedAlias = parsed.declarations[0] as TypeAliasDeclaration;
                parsedAlias.isExported.should.be.false;
                parsedAlias.name.should.equal('Alias');
            });

            it('should parse an exported type alias correctly', () => {
                let parsedAlias = parsed.declarations[1] as TypeAliasDeclaration;
                parsedAlias.isExported.should.be.true;
                parsedAlias.name.should.equal('ExportedAlias');
            });

        });

        describe('Functions', () => {

            const file = join(process.cwd(), '.test/resourceParser/function.ts');

            beforeEach(() => {
                return parser.parseFile(<any>{ fsPath: file }).then(file => parsed = file);
            });

            it('should parse a file', () => {
                parsed.declarations.should.be.an('array').with.lengthOf(2);
            });

            it('should parse a function correctly', () => {
                let parsedAlias = parsed.declarations[0] as FunctionDeclaration;
                parsedAlias.isExported.should.be.false;
                parsedAlias.name.should.equal('function1');
            });

            it('should parse an exported function correctly', () => {
                let parsedAlias = parsed.declarations[1] as FunctionDeclaration;
                parsedAlias.isExported.should.be.true;
                parsedAlias.name.should.equal('function2');
            });

            it('should parse parameters correctly', () => {
                let func1 = parsed.declarations[0] as FunctionDeclaration,
                    func2 = parsed.declarations[1] as FunctionDeclaration;

                func1.parameters.should.be.an('array').with.lengthOf(1);
                func1.parameters[0].name.should.equal('param1');

                func2.parameters.should.be.an('array').with.lengthOf(5);
                func2.parameters[0].name.should.equal('param1');
                func2.parameters[1].name.should.equal('objParam1');
                func2.parameters[2].name.should.equal('objParam2');
                func2.parameters[3].name.should.equal('arrParam1');
                func2.parameters[4].name.should.equal('arrParam2');
            });

            it('should parse variables correctly', () => {
                let func1 = parsed.declarations[0] as FunctionDeclaration,
                    func2 = parsed.declarations[1] as FunctionDeclaration;

                func1.variables.should.be.an('array').with.lengthOf(1);
                func1.variables[0].name.should.equal('var1');
                func1.variables[0].isExported.should.be.false;
                func1.variables[0].isConst.should.be.false;

                func2.variables[0].name.should.equal('constVar1');
                func2.variables[0].isExported.should.be.false;
                func2.variables[0].isConst.should.be.true;
            });

        });

        describe('Variables', () => {

            const file = join(process.cwd(), '.test/resourceParser/variable.ts');

            beforeEach(() => {
                return parser.parseFile(<any>{ fsPath: file }).then(file => parsed = file);
            });

            it('should parse a file', () => {
                parsed.declarations.should.be.an('array').with.lengthOf(7);
            });

            it('should parse a non exported variable', () => {
                let parsedVar = parsed.declarations[0] as VariableDeclaration;
                parsedVar.name.should.equal('NonExportedVariable');
                parsedVar.isExported.should.be.false;
                parsedVar.isConst.should.be.false;
            });

            it('should parse a non exported const', () => {
                let parsedVar = parsed.declarations[1] as VariableDeclaration;
                parsedVar.name.should.equal('NonExportedConst');
                parsedVar.isExported.should.be.false;
                parsedVar.isConst.should.be.true;
            });

            it('should parse an exported variable', () => {
                let parsedVar = parsed.declarations[2] as VariableDeclaration;
                parsedVar.name.should.equal('ExportedVariable');
                parsedVar.isExported.should.be.true;
                parsedVar.isConst.should.be.false;
            });

            it('should parse an exported const', () => {
                let parsedVar = parsed.declarations[3] as VariableDeclaration;
                parsedVar.name.should.equal('ExportedConst');
                parsedVar.isExported.should.be.true;
                parsedVar.isConst.should.be.true;
            });

            it('should parse an exported scope variable', () => {
                let parsedVar = parsed.declarations[4] as VariableDeclaration;
                parsedVar.name.should.equal('ExportedLet');
                parsedVar.isExported.should.be.true;
                parsedVar.isConst.should.be.false;
            });

            it('should parse an exported multiline variable', () => {
                let parsedVar = parsed.declarations[5] as VariableDeclaration;
                parsedVar.name.should.equal('MultiLet1');
                parsedVar.isExported.should.be.true;
                parsedVar.isConst.should.be.false;
                parsedVar = parsed.declarations[6] as VariableDeclaration;
                parsedVar.name.should.equal('MultiLet2');
                parsedVar.isExported.should.be.true;
                parsedVar.isConst.should.be.false;
            });

        });

    });

});
