import * as chai from 'chai';
import { join } from 'path';
import {
    ClassDeclaration,
    DeclarationIndex,
    DefaultDeclaration,
    ExternalModuleImport,
    NamedImport,
    NamespaceImport,
    SymbolSpecifier,
    TypescriptParser,
} from 'typescript-parser';
import { workspace } from 'vscode';

import { getDeclarationsFilteredByImports } from '../../../../src/common/helpers';
import { Container } from '../../../../src/extension/IoC';
import { iocSymbols } from '../../../../src/extension/IoCSymbols';

const should = chai.should();

describe.only('DeclarationIndexHelpers', () => {

    const rootPath = workspace.workspaceFolders![0].uri.fsPath;
    const documentPath = join(rootPath, 'foobar.ts');

    describe('getDeclarationsFilteredByImports()', () => {

        let index: DeclarationIndex;

        before(async () => {
            const parser = Container.get<TypescriptParser>(iocSymbols.typescriptParser);
            index = new DeclarationIndex(parser, rootPath);
            await index.buildIndex(
                [
                    join(
                        rootPath,
                        'typings/globals/body-parser/index.d.ts',
                    ),
                    join(
                        rootPath,
                        'server/indices/MyClass.ts',
                    ),
                    join(
                        rootPath,
                        'server/indices/defaultExport/multiExport.ts',
                    ),
                ],
            );
        });

        it('should return the whole list if no imports are specified', () => {
            const result = getDeclarationsFilteredByImports(index.declarationInfos, documentPath, [], rootPath);
            result.length.should.equal(18);
            should.exist(result.find(d => d.declaration.name === 'Class1'));
            should.exist(result.find(d => d.declaration.name === 'bodyParser'));
            should.exist(result.find(d => d.declaration.name === 'MultiExportClass'));
            should.exist(result.find(d => d.declaration.name === 'multiExport'));
        });

        it('should filter out declarations that are namespace imported', () => {
            const imp = new NamespaceImport('body-parser', 'bodyParser');
            const result = getDeclarationsFilteredByImports(index.declarationInfos, documentPath, [imp], rootPath);
            result.filter(d => d.from === 'body-parser').length.should.equal(0);
        });

        it('should filter out declarations that are module imported', () => {
            const imp = new ExternalModuleImport('body-parser', 'bodyParser');
            const result = getDeclarationsFilteredByImports(index.declarationInfos, documentPath, [imp], rootPath);
            result.filter(d => d.from === 'body-parser').length.should.equal(0);
        });

        it('should filter out a specifier from a named import', () => {
            const imp = new NamedImport('/server/indices/MyClass');
            imp.specifiers.push(new SymbolSpecifier('Class1'));
            const result = getDeclarationsFilteredByImports(index.declarationInfos, documentPath, [imp], rootPath);
            should.not.exist(result.find(d => d.declaration.name === 'Class1'));
            should.exist(result.find(d => d.declaration.name === 'Class2'));
        });

        it('should filter out an aliased specifier from a named import', () => {
            const imp = new NamedImport('/server/indices/MyClass');
            imp.specifiers.push(new SymbolSpecifier('Class1', 'FooBar'));
            const result = getDeclarationsFilteredByImports(index.declarationInfos, documentPath, [imp], rootPath);
            should.not.exist(result.find(d => d.declaration.name === 'Class1'));
            should.exist(result.find(d => d.declaration.name === 'Class2'));
        });

        it('should filter out the default declaration from a named import', () => {
            const imp = new NamedImport('/server/indices/defaultExport/multiExport');
            imp.defaultAlias = 'multiExport';
            const result = getDeclarationsFilteredByImports(index.declarationInfos, documentPath, [imp], rootPath);
            should.exist(
                result.find(d => d.declaration instanceof ClassDeclaration && d.declaration.name === 'MultiExportClass'),
            );
            should.not.exist(
                result.find(d => d.declaration instanceof DefaultDeclaration && d.declaration.name === 'multiExport'),
            );
        });

        it('should filter out a declaration from a file with a default and a normal export', () => {
            const imp = new NamedImport('/server/indices/defaultExport/multiExport');
            imp.specifiers.push(new SymbolSpecifier('MultiExportClass'));
            const result = getDeclarationsFilteredByImports(index.declarationInfos, documentPath, [imp], rootPath);
            should.not.exist(
                result.find(d => d.declaration instanceof ClassDeclaration && d.declaration.name === 'MultiExportClass'),
            );
            should.exist(
                result.find(d => d.declaration instanceof DefaultDeclaration && d.declaration.name === 'multiExport'),
            );
        });

    });

    describe('getAbsolutLibraryName()', () => {

        it('should not contain any \\');

        it('should calculate the correct absolute workspace path');

        it('should return the library name if not a workspace file');

        it('should return the library name if the root path is not set');

    });

    describe('getRelativeLibraryName()', () => {

        it('should not contain any \\');

        it('should calculate the correct relative workspace path');

        it('should return the library name if not a workspace file');

        it('should return the library name if the root path is not set');

    });

    describe('findFiles()', () => { });

});
