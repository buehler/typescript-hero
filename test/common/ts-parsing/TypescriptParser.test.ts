import { TypescriptParser } from '../../../src/common/ts-parsing';
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
            tsImport.specifiers[1].alias!.should.equal('Alias2');
        });

        it('should parse a default import', () => {
            let tsImport = parsed.imports[6] as DefaultImport;

            tsImport.should.be.an.instanceOf(DefaultImport);
            tsImport.libraryName.should.equal('aFile');
            tsImport.alias.should.equal('Foobar');
        });

    });

});
