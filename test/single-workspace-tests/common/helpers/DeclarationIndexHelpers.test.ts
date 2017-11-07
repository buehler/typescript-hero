import * as chai from 'chai';
import { renameSync } from 'fs';
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

import { ExtensionConfig } from '../../../../src/common/config';
import {
    findFiles,
    getAbsolutLibraryName,
    getDeclarationsFilteredByImports,
    getRelativeLibraryName,
} from '../../../../src/common/helpers';
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

        it('should not contain any \\', () => {
            const path = getAbsolutLibraryName('./server/indices/MyClass', documentPath, rootPath);
            path.should.not.contain('\\');
        });

        it('should calculate the correct absolute workspace path', () => {
            const path = getAbsolutLibraryName('./server/indices/MyClass', documentPath, rootPath);
            path.should.equal('/server/indices/MyClass');
        });

        it('should return the library name if not a workspace file', () => {
            const path = getAbsolutLibraryName('body-parser', documentPath, rootPath);
            path.should.equal('body-parser');
        });

        it('should return the library name if the root path is not set', () => {
            const path = getAbsolutLibraryName('./server/indices/MyClass', documentPath);
            path.should.equal('./server/indices/MyClass');
        });

    });

    describe('getRelativeLibraryName()', () => {

        it('should not contain any \\', () => {
            const path = getRelativeLibraryName('/server/indices/MyClass', documentPath, rootPath);
            path.should.not.contain('\\');
        });

        it('should prepend a relative path from the same directory with ./', () => {
            const path = getRelativeLibraryName('/server/indices/MyClass', documentPath, rootPath);
            path.should.equal('./server/indices/MyClass');
        });

        it('should calculate the correct relative workspace path', () => {
            const path = getRelativeLibraryName('/server/indices/MyClass', documentPath, rootPath);
            path.should.equal('./server/indices/MyClass');
        });

        it('should calculate the correct relative workspace path 2', () => {
            const otherDoc = join(rootPath, 'extension', 'managers', 'ClassManagerFile.ts');
            const path = getRelativeLibraryName('/server/indices/MyClass', otherDoc, rootPath);
            path.should.equal('../../server/indices/MyClass');
        });

        it('should return the library name if not a workspace file', () => {
            const path = getRelativeLibraryName('body-parser', documentPath, rootPath);
            path.should.equal('body-parser');
        });

        it('should return the library name if the root path is not set', () => {
            const path = getRelativeLibraryName('/server/indices/MyClass', documentPath);
            path.should.equal('/server/indices/MyClass');
        });

    });

    describe('findFiles()', () => {

        let config: ExtensionConfig;
        const workfolder = workspace.workspaceFolders![0];

        beforeEach(() => {
            config = {
                resolver: {
                    ignorePatterns: [
                        'build/**/*',
                        'dist/**/*',
                        'out/**/*',
                    ],
                    resolverModeFileGlobs: [
                        '**/*.ts',
                        '**/*.tsx',
                        '**/*.js',
                        '**/*.jsx',
                    ],
                },
            } as any as ExtensionConfig;
        });

        it('should find all relevant file in the workspace (*.ts)', async () => {
            config.resolver.resolverModeFileGlobs = config.resolver.resolverModeFileGlobs.filter(o => o.indexOf('ts') >= 0);
            const result = await findFiles(config, workfolder);
            result.length.should.equal(50);
            (result.every(file => file.endsWith('.ts') || file.endsWith('.tsx'))).should.be.true;
            result.should.contain(join(rootPath, 'typings/globals/body-parser/index.d.ts'));
            result.should.contain(join(rootPath, 'foobar.ts'));
            result.should.contain(join(rootPath, 'common/ts-parsing/class.ts'));
            result.should.contain(join(rootPath, 'extension/extensions/codeActionExtension/empty.ts'));
            result.should.contain(join(rootPath, 'node_modules/@types/node/index.d.ts'));
            result.should.contain(join(rootPath, 'node_modules/fancy-library/index.d.ts'));
        });

        it('should find all relevant file in the workspace (*.js)', async () => {
            config.resolver.resolverModeFileGlobs = config.resolver.resolverModeFileGlobs.filter(o => o.indexOf('js') >= 0);
            const result = await findFiles(config, workfolder);
            result.length.should.equal(9);
            result.should.contain(join(rootPath, 'extension/extensions/importResolveExtension/addImportToDocument.js'));
            result.should.contain(join(rootPath, 'extension/extensions/importResolveExtension/jsfile.js'));
            result.should.contain(join(rootPath, 'extension/extensions/importResolveExtension/jsxfile.jsx'));
            result.should.not.contain(join(rootPath, 'common/ts-parsing/class.ts'));
            result.should.not.contain(join(rootPath, 'extension/extensions/codeActionExtension/empty.ts'));
            result.should.contain(join(rootPath, 'node_modules/@types/node/index.d.ts'));
            result.should.contain(join(rootPath, 'node_modules/fancy-library/index.d.ts'));
            result.should.contain(join(rootPath, 'typings/globals/body-parser/index.d.ts'));
        });

        it('should find all relevant file in the workspace (*.ts & *.js)', async () => {
            const result = await findFiles(config, workfolder);
            result.length.should.equal(53);
            result.should.contain(join(rootPath, 'extension/extensions/importResolveExtension/addImportToDocument.js'));
            result.should.contain(join(rootPath, 'extension/extensions/importResolveExtension/jsfile.js'));
            result.should.contain(join(rootPath, 'extension/extensions/importResolveExtension/jsxfile.jsx'));
            result.should.contain(join(rootPath, 'foobar.ts'));
            result.should.contain(join(rootPath, 'common/ts-parsing/class.ts'));
            result.should.contain(join(rootPath, 'common/ts-parsing/class.ts'));
            result.should.contain(join(rootPath, 'extension/extensions/codeActionExtension/empty.ts'));
            result.should.contain(join(rootPath, 'node_modules/@types/node/index.d.ts'));
            result.should.contain(join(rootPath, 'node_modules/fancy-library/index.d.ts'));
            result.should.contain(join(rootPath, 'typings/globals/body-parser/index.d.ts'));
        });

        it('should not contain build, out or dist files', async () => {
            const result = await findFiles(config, workfolder);
            result.should.not.contain(join(rootPath, 'build/app.js'));
            result.should.not.contain(join(rootPath, 'build/app.d.ts'));
            result.should.not.contain(join(rootPath, 'out/out.js'));
            result.should.not.contain(join(rootPath, 'out/out.d.ts'));
        });

        it('should contain build files when configured otherwise', async () => {
            config.resolver.ignorePatterns = [];
            const result = await findFiles(config, workfolder);
            result.should.contain(join(rootPath, 'build/app.js'));
            result.should.contain(join(rootPath, 'build/app.d.ts'));
            result.should.contain(join(rootPath, 'out/out.js'));
            result.should.contain(join(rootPath, 'out/out.d.ts'));
        });

        describe('without package.json', () => {

            const packageJson = join(rootPath, 'package.json');
            const packageJsonNew = join(rootPath, 'package-new.json');

            before(() => {
                renameSync(packageJson, packageJsonNew);
            });

            after(() => {
                renameSync(packageJsonNew, packageJson);
            });

            it('should not contain node_modules when package.json is not present', async () => {
                const result = await findFiles(config, workfolder);
                result.should.not.contain(join(rootPath, 'node_modules/@types/node/index.d.ts'));
                result.should.not.contain(join(rootPath, 'node_modules/fancy-library/index.d.ts'));
            });

        });

    });

});
