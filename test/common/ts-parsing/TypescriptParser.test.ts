import { TypescriptParser } from '../../../src/common/ts-parsing';
import { DefaultDeclaration } from '../../../src/common/ts-parsing/declarations';
import { AllExport, AssignedExport, NamedExport } from '../../../src/common/ts-parsing/exports';
import {
    DefaultImport,
    ExternalModuleImport,
    NamedImport,
    NamespaceImport,
    StringImport
} from '../../../src/common/ts-parsing/imports';
import { Resource } from '../../../src/common/ts-parsing/resources';
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
            let tsImport = parsed.imports[1] as NamedImport;

            tsImport.should.be.an.instanceOf(NamedImport);
            tsImport.libraryName.should.equal('namedImport');
            tsImport.specifiers[0].specifier.should.equal('Specifier1');
            tsImport.specifiers[1].specifier.should.equal('Specifier2');
            tsImport.specifiers[2].specifier.should.equal('Specifier3');
        });

        it('should parse named import with aliased specifier', () => {
            let tsImport = parsed.imports[2] as NamedImport;

            tsImport.should.be.an.instanceOf(NamedImport);
            tsImport.libraryName.should.equal('namedAliasedImport');
            tsImport.specifiers[0].specifier.should.equal('Specifier1');
            tsImport.specifiers[0].alias!.should.equal('Alias1');
        });

        it('should parse namespace import', () => {
            let tsImport = parsed.imports[3] as NamespaceImport;

            tsImport.should.be.an.instanceOf(NamespaceImport);
            tsImport.libraryName.should.equal('namespace');
            tsImport.alias.should.equal('namespaceImport');
        });

        it('should parse external module import', () => {
            let tsImport = parsed.imports[4] as ExternalModuleImport;

            tsImport.should.be.an.instanceOf(ExternalModuleImport);
            tsImport.libraryName.should.equal('externalModule');
            tsImport.alias.should.equal('external');
        });

        it('should parse a multiline import', () => {
            let tsImport = parsed.imports[5] as NamedImport;

            tsImport.should.be.an.instanceOf(NamedImport);
            tsImport.libraryName.should.equal('multiLineImport');
            tsImport.specifiers[0].specifier.should.equal('Spec1');
            tsImport.specifiers[1].specifier.should.equal('Spec2');
            should.equal(tsImport.specifiers[1].alias, 'Alias2');
        });

        it('should parse a default import', () => {
            let tsImport = parsed.imports[6] as DefaultImport;

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
            let exp = parsed.exports[1] as NamedExport;

            exp.specifiers.should.be.an('array').with.lengthOf(2);

            let spec = exp.specifiers[1];
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

});
