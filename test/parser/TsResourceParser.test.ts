import 'reflect-metadata';
import {
    ClassDeclaration,
    DefaultDeclaration,
    EnumDeclaration,
    FunctionDeclaration,
    InterfaceDeclaration,
    PropertyVisibility,
    TypeAliasDeclaration,
    VariableDeclaration
} from '../../src/models/TsDeclaration';
import { TsAllFromExport, TsAssignedExport, TsNamedFromExport } from '../../src/models/TsExport';
import {
    TsDefaultImport,
    TsExternalModuleImport,
    TsNamedImport,
    TsNamespaceImport,
    TsStringImport
} from '../../src/models/TsImport';
import { TsModule, TsNamespace, TsResource } from '../../src/models/TsResource';
import { TsResourceParser } from '../../src/parser/TsResourceParser';
import * as chai from 'chai';
import { join } from 'path';
import * as vscode from 'vscode';

let should = chai.should();

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

        const file = join(vscode.workspace.rootPath, 'resourceParser/importsOnly.ts');

        beforeEach(async done => {
            parsed = await parser.parseFile(<any>{ fsPath: file });
            done();
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

        const file = join(vscode.workspace.rootPath, 'resourceParser/exportsOnly.ts');

        beforeEach(async done => {
            parsed = await parser.parseFile(<any>{ fsPath: file });
            done();
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

        it('should parse aliased export named from another file', () => {
            parsed.exports[1].should.be.an.instanceOf(TsNamedFromExport);
            let exp = parsed.exports[1] as TsNamedFromExport;

            exp.specifiers.should.be.an('array').with.lengthOf(2);

            let spec = exp.specifiers[1];
            spec.specifier.should.equal('Specifier');
            spec.alias.should.equal('Alias');
        });

        it('should parse export assignment', () => {
            parsed.exports[2].should.be.an.instanceOf(TsAssignedExport)
                .with.property('declarationIdentifier')
                .that.equals('Foo');
        });

        it('should parse default export', () => {
            parsed.declarations[0].should.be.an.instanceOf(DefaultDeclaration);
            parsed.declarations[0].name.should.equal('DefaultExport');
        });

    });

    describe('Declarations', () => {

        describe('Enums', () => {

            const file = join(vscode.workspace.rootPath, 'resourceParser/enum.ts');

            beforeEach(async done => {
                parsed = await parser.parseFile(<any>{ fsPath: file });
                done();
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

            const file = join(vscode.workspace.rootPath, 'resourceParser/typeAlias.ts');

            beforeEach(async done => {
                parsed = await parser.parseFile(<any>{ fsPath: file });
                done();
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

            const file = join(vscode.workspace.rootPath, 'resourceParser/function.ts');

            beforeEach(async done => {
                parsed = await parser.parseFile(<any>{ fsPath: file });
                done();
            });

            it('should parse a file', () => {
                parsed.declarations.should.be.an('array').with.lengthOf(3);
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

            it('should parse return types correctly', () => {
                let func1 = parsed.declarations[0] as FunctionDeclaration,
                    func2 = parsed.declarations[1] as FunctionDeclaration,
                    func3 = parsed.declarations[2] as FunctionDeclaration;

                func1.type.should.equal('string');
                func2.type.should.equal('void');
                should.not.exist(func3.type);
            });

        });

        describe('Variables', () => {

            const file = join(vscode.workspace.rootPath, 'resourceParser/variable.ts');

            beforeEach(async done => {
                parsed = await parser.parseFile(<any>{ fsPath: file });
                done();
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

        describe('Interfaces', () => {

            const file = join(vscode.workspace.rootPath, 'resourceParser/interface.ts');

            beforeEach(async done => {
                parsed = await parser.parseFile(<any>{ fsPath: file });
                done();
            });

            it('should parse a file', () => {
                parsed.declarations.should.be.an('array').with.lengthOf(2);
            });

            it('should parse a non exported interface', () => {
                let parsedInterface = parsed.declarations[0] as InterfaceDeclaration;
                parsedInterface.name.should.equal('NonExportedInterface');
                parsedInterface.isExported.should.be.false;

                parsedInterface.methods[0].name.should.equal('method1');
                parsedInterface.methods[1].name.should.equal('method2');

                parsedInterface.properties[0].name.should.equal('property1');
                parsedInterface.properties[1].name.should.equal('property2');

                parsedInterface.properties[0].visibility.should.equal(PropertyVisibility.Public);
                parsedInterface.properties[1].visibility.should.equal(PropertyVisibility.Public);
            });

            it('should parse an exported interface', () => {
                let parsedInterface = parsed.declarations[1] as InterfaceDeclaration;
                parsedInterface.name.should.equal('ExportedInterface');
                parsedInterface.isExported.should.be.true;

                parsedInterface.methods[0].name.should.equal('method1');
                parsedInterface.methods[1].name.should.equal('method2');
                parsedInterface.methods[1].parameters[0].name.should.equal('param1');

                parsedInterface.properties[0].name.should.equal('property1');
                parsedInterface.properties[1].name.should.equal('property2');

                parsedInterface.properties[0].visibility.should.equal(PropertyVisibility.Public);
                parsedInterface.properties[1].visibility.should.equal(PropertyVisibility.Public);
            });

        });

        describe('Classes', () => {

            const file = join(vscode.workspace.rootPath, 'resourceParser/class.ts');

            beforeEach(async done => {
                parsed = await parser.parseFile(<any>{ fsPath: file });
                done();
            });

            it('should parse a file', () => {
                parsed.declarations.should.be.an('array').with.lengthOf(3);
            });

            it('should parse an abstract class', () => {
                let parsedClass = parsed.declarations[0] as ClassDeclaration;
                parsedClass.name.should.equal('AbstractClass');
                parsedClass.isExported.should.be.false;

                parsedClass.methods[0].name.should.equal('method1');
                parsedClass.methods[1].name.should.equal('abstractMethod');
            });

            it('should parse a non exported class', () => {
                let parsedClass = parsed.declarations[1] as ClassDeclaration;
                parsedClass.name.should.equal('NonExportedClass');
                parsedClass.isExported.should.be.false;

                parsedClass.methods[0].name.should.equal('method1');
                parsedClass.methods[1].name.should.equal('method2');
                parsedClass.methods[2].name.should.equal('method3');

                parsedClass.methods[2].variables[0].name.should.equal('variable');

                parsedClass.ctor.parameters[0].name.should.equal('param1');

                parsedClass.properties[0].name.should.equal('param1');
                parsedClass.properties[0].visibility.should.equal(PropertyVisibility.Public);
            });

            it('should parse an exported class', () => {
                let parsedClass = parsed.declarations[2] as ClassDeclaration;
                parsedClass.name.should.equal('ExportedClass');
                parsedClass.isExported.should.be.true;

                parsedClass.properties[0].name.should.equal('_property');
                parsedClass.properties[0].visibility.should.equal(PropertyVisibility.Private);
                parsedClass.properties[1].name.should.equal('protect');
                parsedClass.properties[1].visibility.should.equal(PropertyVisibility.Protected);
                parsedClass.properties[2].name.should.equal('pub');
                parsedClass.properties[2].visibility.should.equal(PropertyVisibility.Public);
            });

        });

        describe('Modules', () => {

            const file = join(vscode.workspace.rootPath, 'resourceParser/module.ts');

            beforeEach(async done => {
                parsed = await parser.parseFile(<any>{ fsPath: file });
                done();
            });

            it('should parse a file', () => {
                parsed.resources.should.be.an('array').with.lengthOf(2);
            });

            it('should parse a module', () => {
                let parsedModule = parsed.resources[0] as TsModule;
                parsedModule.name.should.equal('Module');
                parsedModule.declarations[0].name.should.equal('modFunc');
            });

            it('should parse a namespace', () => {
                let parsedNamespace = parsed.resources[1] as TsNamespace;
                parsedNamespace.name.should.equal('Namespace');
                parsedNamespace.declarations[0].name.should.equal('NotExported');
                parsedNamespace.declarations[1].name.should.equal('Exported');
            });

        });

    });

    describe('Usages', () => {
        const file = join(vscode.workspace.rootPath, 'resourceParser/usagesOnly.ts');

        beforeEach(async done => {
            parsed = await parser.parseFile(<any>{ fsPath: file });
            done();
        });

        it('should parse decorator usages', () => {
            let usages = parsed.usages;
            usages.should.contain('ClassDecorator');
            usages.should.contain('PropertyDecorator');
            usages.should.contain('FunctionDecorator');
        });

        it('should parse class member', () => {
            let usages = parsed.usages;
            usages.should.contain('notInitializedProperty');
            usages.should.contain('typedProperty');
        });

        it('should parse class member types', () => {
            let usages = parsed.usages;
            usages.should.contain('TypedPropertyRef');
        });

        it('should parse class member assignment', () => {
            let usages = parsed.usages;
            usages.should.contain('AssignedProperty');
        });

        it('should parse params', () => {
            let usages = parsed.usages;
            usages.should.contain('param');
        });

        it('should parse param default assignment', () => {
            let usages = parsed.usages;
            usages.should.contain('DefaultParam');
        });

        it('should parse return value', () => {
            let usages = parsed.usages;
            usages.should.contain('ReturnValue');
        });

        it('should parse property access', () => {
            let usages = parsed.usages;
            usages.should.contain('PropertyAccess');
        });

        it('should not parse sub properties of accessed properties', () => {
            let usages = parsed.usages;
            usages.should.not.contain('To');
            usages.should.not.contain('My');
            usages.should.not.contain('Foobar');
        });

        it('should parse function call', () => {
            let usages = parsed.usages;
            usages.should.contain('functionCall');
            usages.should.contain('MyProperty');
        });

        it('should parse indexer access', () => {
            let usages = parsed.usages;
            usages.should.contain('Indexing');
        });

        it('should parse variable assignment', () => {
            let usages = parsed.usages;
            usages.should.contain('AssignmentToVariable');
        });

        it('should parse nested identifier', () => {
            let usages = parsed.usages;
            usages.should.contain('NestedBinaryAssignment');
        });

    });

});
