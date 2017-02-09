import { TypescriptParser } from '../../../src/common/ts-parsing';
import {
    ClassDeclaration,
    DeclarationVisibility,
    DefaultDeclaration,
    EnumDeclaration,
    FunctionDeclaration,
    InterfaceDeclaration,
    TypeAliasDeclaration,
    VariableDeclaration
} from '../../../src/common/ts-parsing/declarations';
import { AllExport, AssignedExport, NamedExport } from '../../../src/common/ts-parsing/exports';
import {
    DefaultImport,
    ExternalModuleImport,
    NamedImport,
    NamespaceImport,
    StringImport
} from '../../../src/common/ts-parsing/imports';
import { Module, Namespace, Resource } from '../../../src/common/ts-parsing/resources';
import * as chai from 'chai';
import { join } from 'path';
import * as vscode from 'vscode';

const should = chai.should();

describe('common / TypescriptParser', () => {

    let parser: TypescriptParser,
        parsed: Resource;

    beforeEach(() => {
        parser = new TypescriptParser();
    });

    describe('Import parsing', () => {

        const file = join(vscode.workspace.rootPath, 'common/ts-parsing/importsOnly.ts');

        beforeEach(async done => {
            parsed = await parser.parseFile(file, vscode.workspace.rootPath);
            done();
        });

        it('should parse imports', () => {
            parsed.imports.should.be.an('array').with.lengthOf(7);
        });

        it('should parse string import', () => {
            parsed.imports[0].should.be
                .an.instanceOf(StringImport)
                .with.property('libraryName').that.equals('stringImport');
        });

        it('should parse named import', () => {
            const tsImport = parsed.imports[1] as NamedImport;

            tsImport.should.be.an.instanceOf(NamedImport);
            tsImport.libraryName.should.equal('namedImport');
            tsImport.specifiers[0].specifier.should.equal('Specifier1');
            tsImport.specifiers[1].specifier.should.equal('Specifier2');
            tsImport.specifiers[2].specifier.should.equal('Specifier3');
        });

        it('should parse named import with aliased specifier', () => {
            const tsImport = parsed.imports[2] as NamedImport;

            tsImport.should.be.an.instanceOf(NamedImport);
            tsImport.libraryName.should.equal('namedAliasedImport');
            tsImport.specifiers[0].specifier.should.equal('Specifier1');
            tsImport.specifiers[0].alias!.should.equal('Alias1');
        });

        it('should parse namespace import', () => {
            const tsImport = parsed.imports[3] as NamespaceImport;

            tsImport.should.be.an.instanceOf(NamespaceImport);
            tsImport.libraryName.should.equal('namespace');
            tsImport.alias.should.equal('namespaceImport');
        });

        it('should parse external module import', () => {
            const tsImport = parsed.imports[4] as ExternalModuleImport;

            tsImport.should.be.an.instanceOf(ExternalModuleImport);
            tsImport.libraryName.should.equal('externalModule');
            tsImport.alias.should.equal('external');
        });

        it('should parse a multiline import', () => {
            const tsImport = parsed.imports[5] as NamedImport;

            tsImport.should.be.an.instanceOf(NamedImport);
            tsImport.libraryName.should.equal('multiLineImport');
            tsImport.specifiers[0].specifier.should.equal('Spec1');
            tsImport.specifiers[1].specifier.should.equal('Spec2');
            should.equal(tsImport.specifiers[1].alias, 'Alias2');
        });

        it('should parse a default import', () => {
            const tsImport = parsed.imports[6] as DefaultImport;

            tsImport.should.be.an.instanceOf(DefaultImport);
            tsImport.libraryName.should.equal('aFile');
            tsImport.alias.should.equal('Foobar');
        });

    });

    describe('Export parsing', () => {

        const file = join(vscode.workspace.rootPath, 'common/ts-parsing/exportsOnly.ts');

        beforeEach(async done => {
            parsed = await parser.parseFile(file, vscode.workspace.rootPath);
            done();
        });

        it('should parse export all from another file', () => {
            parsed.exports[0].should.be.an.instanceOf(AllExport)
                .with.property('from')
                .that.equals('./OtherFile');
        });

        it('should parse export named from another file', () => {
            parsed.exports[1].should.be.an.instanceOf(NamedExport)
                .with.property('from')
                .that.equals('./AnotherFile');
        });

        it('should parse aliased export named from another file', () => {
            parsed.exports[1].should.be.an.instanceOf(NamedExport);
            const exp = parsed.exports[1] as NamedExport;

            exp.specifiers.should.be.an('array').with.lengthOf(2);

            const spec = exp.specifiers[1];
            spec.specifier.should.equal('Specifier');
            should.equal(spec.alias, 'Alias');
        });

        it('should parse export assignment', () => {
            parsed.exports[2].should.be.an.instanceOf(AssignedExport)
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

            const file = join(vscode.workspace.rootPath, 'common/ts-parsing/enum.ts');

            beforeEach(async done => {
                parsed = await parser.parseFile(file, vscode.workspace.rootPath);
                done();
            });

            it('should parse a file', () => {
                parsed.declarations.should.be.an('array').with.lengthOf(2);
            });

            it('should parse an enum correctly', () => {
                const parsedEnum = parsed.declarations[0] as EnumDeclaration;
                parsedEnum.isExported.should.be.false;
                parsedEnum.name.should.equal('Enumeration');
                parsedEnum.members.should.be.an('array').with.lengthOf(3);
                parsedEnum.members[0].should.equal('Member1');
            });

            it('should parse an exported enum correctly', () => {
                const parsedEnum = parsed.declarations[1] as EnumDeclaration;
                parsedEnum.isExported.should.be.true;
                parsedEnum.name.should.equal('ConstantEnumeration');
                parsedEnum.members.should.be.an('array').with.lengthOf(2);
                parsedEnum.members[0].should.equal('ConstMember1');
            });

        });

        describe('Type aliases', () => {

            const file = join(vscode.workspace.rootPath, 'common/ts-parsing/typeAlias.ts');

            beforeEach(async done => {
                parsed = await parser.parseFile(file, vscode.workspace.rootPath);
                done();
            });

            it('should parse a file', () => {
                parsed.declarations.should.be.an('array').with.lengthOf(2);
            });

            it('should parse a type alias correctly', () => {
                const parsedAlias = parsed.declarations[0] as TypeAliasDeclaration;
                parsedAlias.isExported.should.be.false;
                parsedAlias.name.should.equal('Alias');
            });

            it('should parse an exported type alias correctly', () => {
                const parsedAlias = parsed.declarations[1] as TypeAliasDeclaration;
                parsedAlias.isExported.should.be.true;
                parsedAlias.name.should.equal('ExportedAlias');
            });

        });

        describe('Functions', () => {

            const file = join(vscode.workspace.rootPath, 'common/ts-parsing/function.ts');

            beforeEach(async done => {
                parsed = await parser.parseFile(file, vscode.workspace.rootPath);
                done();
            });

            it('should parse a file', () => {
                parsed.declarations.should.be.an('array').with.lengthOf(4);
            });

            it('should parse a function correctly', () => {
                const parsedAlias = parsed.declarations[0] as FunctionDeclaration;
                parsedAlias.isExported.should.be.false;
                parsedAlias.name.should.equal('function1');
            });

            it('should parse an exported function correctly', () => {
                const parsedAlias = parsed.declarations[1] as FunctionDeclaration;
                parsedAlias.isExported.should.be.true;
                parsedAlias.name.should.equal('function2');
            });

            it('should parse parameters correctly', () => {
                const func1 = parsed.declarations[0] as FunctionDeclaration,
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
                const func1 = parsed.declarations[0] as FunctionDeclaration,
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
                const func1 = parsed.declarations[0] as FunctionDeclaration,
                    func2 = parsed.declarations[1] as FunctionDeclaration,
                    func3 = parsed.declarations[2] as FunctionDeclaration;

                should.equal(func1.type, 'string');
                should.equal(func2.type, 'void');
                should.not.exist(func3.type);
            });

            it('should parse a typeguard correctly', () => {
                const func1 = parsed.declarations[3] as FunctionDeclaration;

                should.equal(func1.type, 'str is number');
            });

        });

        describe('Variables', () => {

            const file = join(vscode.workspace.rootPath, 'common/ts-parsing/variable.ts');

            beforeEach(async done => {
                parsed = await parser.parseFile(file, vscode.workspace.rootPath);
                done();
            });

            it('should parse a file', () => {
                parsed.declarations.should.be.an('array').with.lengthOf(7);
            });

            it('should parse a non exported variable', () => {
                const parsedVar = parsed.declarations[0] as VariableDeclaration;
                parsedVar.name.should.equal('NonExportedVariable');
                parsedVar.isExported.should.be.false;
                parsedVar.isConst.should.be.false;
            });

            it('should parse a non exported const', () => {
                const parsedVar = parsed.declarations[1] as VariableDeclaration;
                parsedVar.name.should.equal('NonExportedConst');
                parsedVar.isExported.should.be.false;
                parsedVar.isConst.should.be.true;
            });

            it('should parse an exported variable', () => {
                const parsedVar = parsed.declarations[2] as VariableDeclaration;
                parsedVar.name.should.equal('ExportedVariable');
                parsedVar.isExported.should.be.true;
                parsedVar.isConst.should.be.false;
            });

            it('should parse an exported const', () => {
                const parsedVar = parsed.declarations[3] as VariableDeclaration;
                parsedVar.name.should.equal('ExportedConst');
                parsedVar.isExported.should.be.true;
                parsedVar.isConst.should.be.true;
            });

            it('should parse an exported scope variable', () => {
                const parsedVar = parsed.declarations[4] as VariableDeclaration;
                parsedVar.name.should.equal('Exportedconst');
                parsedVar.isExported.should.be.true;
                parsedVar.isConst.should.be.false;
            });

            it('should parse an exported multiline variable', () => {
                let parsedVar = parsed.declarations[5] as VariableDeclaration;
                parsedVar.name.should.equal('Multiconst1');
                parsedVar.isExported.should.be.true;
                parsedVar.isConst.should.be.false;
                parsedVar = parsed.declarations[6] as VariableDeclaration;
                parsedVar.name.should.equal('Multiconst2');
                parsedVar.isExported.should.be.true;
                parsedVar.isConst.should.be.false;
            });

        });

        describe('Interfaces', () => {

            const file = join(vscode.workspace.rootPath, 'common/ts-parsing/interface.ts');

            beforeEach(async done => {
                parsed = await parser.parseFile(file, vscode.workspace.rootPath);
                done();
            });

            it('should parse a file', () => {
                parsed.declarations.should.be.an('array').with.lengthOf(2);
            });

            it('should parse a non exported interface', () => {
                const parsedInterface = parsed.declarations[0] as InterfaceDeclaration;
                parsedInterface.name.should.equal('NonExportedInterface');
                parsedInterface.isExported.should.be.false;

                parsedInterface.methods[0].name.should.equal('method1');
                parsedInterface.methods[1].name.should.equal('method2');

                parsedInterface.properties[0].name.should.equal('property1');
                parsedInterface.properties[1].name.should.equal('property2');

                should.equal(parsedInterface.properties[0].visibility, DeclarationVisibility.Public);
                should.equal(parsedInterface.properties[1].visibility, DeclarationVisibility.Public);
            });

            it('should parse an exported interface', () => {
                const parsedInterface = parsed.declarations[1] as InterfaceDeclaration;
                parsedInterface.name.should.equal('ExportedInterface');
                parsedInterface.isExported.should.be.true;

                parsedInterface.methods[0].name.should.equal('method1');
                parsedInterface.methods[1].name.should.equal('method2');
                parsedInterface.methods[1].parameters[0].name.should.equal('param1');

                parsedInterface.properties[0].name.should.equal('property1');
                parsedInterface.properties[1].name.should.equal('property2');

                should.equal(parsedInterface.properties[0].visibility, DeclarationVisibility.Public);
                should.equal(parsedInterface.properties[1].visibility, DeclarationVisibility.Public);
            });

            it('should parse the returntype of a method', () => {
                const parsedInterface = parsed.declarations[0] as InterfaceDeclaration;
                should.not.exist(parsedInterface.methods[0].type);
                should.equal(parsedInterface.methods[1].type, 'void');
            });

            it('should parse the type of a property', () => {
                const parsedInterface = parsed.declarations[1] as InterfaceDeclaration;
                should.equal(parsedInterface.properties[0].type, 'string');
                should.equal(parsedInterface.properties[1].type, 'number');
            });

        });

        describe('Classes', () => {

            const file = join(vscode.workspace.rootPath, 'common/ts-parsing/class.ts');

            beforeEach(async done => {
                parsed = await parser.parseFile(file, vscode.workspace.rootPath);
                done();
            });

            it('should parse a file', () => {
                parsed.declarations.should.be.an('array').with.lengthOf(3);
            });

            it('should parse an abstract class', () => {
                const parsedClass = parsed.declarations[0] as ClassDeclaration;
                parsedClass.name.should.equal('AbstractClass');
                parsedClass.isExported.should.be.false;

                parsedClass.methods[0].name.should.equal('method1');
                parsedClass.methods[1].name.should.equal('abstractMethod');
            });

            it('should parse a non exported class', () => {
                const parsedClass = parsed.declarations[1] as ClassDeclaration;
                parsedClass.name.should.equal('NonExportedClass');
                parsedClass.isExported.should.be.false;

                parsedClass.methods[0].name.should.equal('method1');
                parsedClass.methods[1].name.should.equal('method2');
                parsedClass.methods[2].name.should.equal('method3');

                parsedClass.methods[2].variables[0].name.should.equal('variable');

                parsedClass.ctor.parameters[0].name.should.equal('param1');

                parsedClass.properties[0].name.should.equal('param1');
                should.equal(parsedClass.properties[0].visibility, DeclarationVisibility.Public);
            });

            it('should parse an exported class', () => {
                const parsedClass = parsed.declarations[2] as ClassDeclaration;
                parsedClass.name.should.equal('ExportedClass');
                parsedClass.isExported.should.be.true;

                parsedClass.properties[0].name.should.equal('_property');
                should.equal(parsedClass.properties[0].visibility, DeclarationVisibility.Private);
                parsedClass.properties[1].name.should.equal('protect');
                should.equal(parsedClass.properties[1].visibility, DeclarationVisibility.Protected);
                parsedClass.properties[2].name.should.equal('pub');
                should.equal(parsedClass.properties[2].visibility, DeclarationVisibility.Public);
            });

            it('should parse the returntype of a method', () => {
                const parsedClass = parsed.declarations[0] as ClassDeclaration;
                should.not.exist(parsedClass.methods[0].type);
                should.equal(parsedClass.methods[1].type, 'void');
            });

            it('should parse the type of a property', () => {
                const parsedClass = parsed.declarations[2] as ClassDeclaration;
                should.equal(parsedClass.properties[0].type, 'string');
            });

            it('should parse the type of a constructor introduced property', () => {
                const parsedClass = parsed.declarations[1] as ClassDeclaration;
                should.equal(parsedClass.properties[0].type, 'string');
            });

            it('should parse a methods visibility', () => {
                const parsedClass = parsed.declarations[1] as ClassDeclaration;
                should.equal(parsedClass.methods[0].visibility, DeclarationVisibility.Public);
            });

        });

        describe('Modules', () => {

            const file = join(vscode.workspace.rootPath, 'common/ts-parsing/module.ts');

            beforeEach(async done => {
                parsed = await parser.parseFile(file, vscode.workspace.rootPath);
                done();
            });

            it('should parse a file', () => {
                parsed.resources.should.be.an('array').with.lengthOf(2);
            });

            it('should parse a module', () => {
                const parsedModule = parsed.resources[0] as Module;
                parsedModule.name.should.equal('Module');
                parsedModule.declarations[0].name.should.equal('modFunc');
            });

            it('should parse a namespace', () => {
                const parsedNamespace = parsed.resources[1] as Namespace;
                parsedNamespace.name.should.equal('Namespace');
                parsedNamespace.declarations[0].name.should.equal('NotExported');
                parsedNamespace.declarations[1].name.should.equal('Exported');
            });

        });

    });

    describe('Usages', () => {

        const file = join(vscode.workspace.rootPath, 'common/ts-parsing/usagesOnly.ts');

        beforeEach(async done => {
            parsed = await parser.parseFile(file, vscode.workspace.rootPath);
            done();
        });

        it('should parse decorator usages', () => {
            const usages = parsed.usages;
            usages.should.contain('ClassDecorator');
            usages.should.contain('PropertyDecorator');
            usages.should.contain('FunctionDecorator');
        });

        it('should parse class member', () => {
            const usages = parsed.usages;
            usages.should.contain('notInitializedProperty');
            usages.should.contain('typedProperty');
        });

        it('should parse class member types', () => {
            const usages = parsed.usages;
            usages.should.contain('TypedPropertyRef');
        });

        it('should parse class member assignment', () => {
            const usages = parsed.usages;
            usages.should.contain('AssignedProperty');
        });

        it('should parse params', () => {
            const usages = parsed.usages;
            usages.should.contain('param');
        });

        it('should parse param default assignment', () => {
            const usages = parsed.usages;
            usages.should.contain('DefaultParam');
        });

        it('should parse return value', () => {
            const usages = parsed.usages;
            usages.should.contain('ReturnValue');
        });

        it('should parse property access', () => {
            const usages = parsed.usages;
            usages.should.contain('PropertyAccess');
        });

        it('should not parse sub properties of accessed properties', () => {
            const usages = parsed.usages;
            usages.should.not.contain('To');
            usages.should.not.contain('My');
            usages.should.not.contain('Foobar');
        });

        it('should parse function call', () => {
            const usages = parsed.usages;
            usages.should.contain('functionCall');
            usages.should.contain('MyProperty');
        });

        it('should parse indexer access', () => {
            const usages = parsed.usages;
            usages.should.contain('Indexing');
        });

        it('should parse variable assignment', () => {
            const usages = parsed.usages;
            usages.should.contain('AssignmentToVariable');
        });

        it('should parse nested identifier', () => {
            const usages = parsed.usages;
            usages.should.contain('NestedBinaryAssignment');
        });

    });

});
