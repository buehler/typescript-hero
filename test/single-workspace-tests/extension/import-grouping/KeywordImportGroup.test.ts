import * as chai from 'chai';
import { join } from 'path';
import { File, TypescriptCodeGenerator, TypescriptParser } from 'typescript-parser';
import { workspace } from 'vscode';

import { TypescriptCodeGeneratorFactory } from '../../../../src/common/factories';
import { ImportGroupKeyword, KeywordImportGroup } from '../../../../src/extension/import-grouping';
import { Container } from '../../../../src/extension/IoC';
import { iocSymbols } from '../../../../src/extension/IoCSymbols';

chai.should();


describe('KeywordImportGroup', () => {

    const rootPath = workspace.workspaceFolders![0].uri.fsPath;
    let file: File;
    let specifiersFile: File;
    let importGroup: KeywordImportGroup;
    let generator: TypescriptCodeGenerator;

    before(async () => {
        const parser = Container.get<TypescriptParser>(iocSymbols.typescriptParser);
        generator = Container.get<TypescriptCodeGeneratorFactory>(iocSymbols.generatorFactory)();
        file = await parser.parseFile(
            join(
                rootPath,
                'extension/import-grouping/imports.ts',
            ),
            rootPath,
        );
        specifiersFile = await parser.parseFile(
            join(
                rootPath,
                'extension/import-grouping/first-specifier-imports.ts',
            ),
            rootPath,
        );
    });

    describe(`keyword "Modules"`, () => {

        beforeEach(() => {
            importGroup = new KeywordImportGroup(ImportGroupKeyword.Modules);
        });

        it('should process a module import', () => {
            importGroup.processImport(file.imports[4]).should.be.true;
        });

        it('should not process a plain import', () => {
            importGroup.processImport(file.imports[0]).should.be.false;
        });

        it('should not process a workspace import', () => {
            importGroup.processImport(file.imports[2]).should.be.false;
        });

        it('should correctly process a list of imports', () => {
            file.imports.map(i => importGroup.processImport(i)).should.deep.equal([false, false, false, false, true, true]);
        });

        describe('when sorting by module paths', () => {
            it('should generate the correct typescript (asc)', () => {
                for (const imp of file.imports) {
                    if (importGroup.processImport(imp)) {
                        continue;
                    }
                }
                generator.generate(importGroup as any).should.equal(
                    `import { AnotherModuleFoo } from 'anotherLib';\n` +
                    `import { ModuleFoobar } from 'myLib';\n`,
                );
            });

            it('should generate the correct typescript (desc)', () => {
                (importGroup as any).order = 'desc';
                for (const imp of file.imports) {
                    if (importGroup.processImport(imp)) {
                        continue;
                    }
                }
                generator.generate(importGroup as any).should.equal(
                    `import { ModuleFoobar } from 'myLib';\n` +
                    `import { AnotherModuleFoo } from 'anotherLib';\n`,
                );
            });
        });

        describe('when sorting by first specifiers', () => {
            before(async () => {
                const config = workspace.getConfiguration('typescriptHero');
                await config.update('resolver.organizeSortsByFirstSpecifier', true);
            });

            after(async () => {
                const config = workspace.getConfiguration('typescriptHero');
                await config.update('resolver.organizeSortsByFirstSpecifier', false);
            });

            it('should generate the correct typescript (asc)', () => {
                for (const imp of specifiersFile.imports) {
                    if (importGroup.processImport(imp)) {
                        continue;
                    }
                }
                generator.generate(importGroup as any).should.equal(
                    "import { AnotherFoobar } from 'someOtherLib';\n" +
                    "import { Foobar, Genero } from 'someLib';\n" +
                    "import ModuleFoobar from 'myLib';\n" +
                    "import { AnotherModuleFoo as MuchFurtherSorted } from 'anotherLib';\n"
                );
            });

            it('should generate the correct typescript (desc)', () => {
                (importGroup as any).order = 'desc';
                for (const imp of specifiersFile.imports) {
                    if (importGroup.processImport(imp)) {
                        continue;
                    }
                }
                generator.generate(importGroup as any).should.equal(
                    "import { AnotherModuleFoo as MuchFurtherSorted } from 'anotherLib';\n" +
                    "import ModuleFoobar from 'myLib';\n" +
                    "import { Foobar, Genero } from 'someLib';\n" +
                    "import { AnotherFoobar } from 'someOtherLib';\n"
                );
            });
        });

    });

    describe(`keyword "Plains"`, () => {

        beforeEach(() => {
            importGroup = new KeywordImportGroup(ImportGroupKeyword.Plains);
        });

        it('should not process a module import', () => {
            importGroup.processImport(file.imports[4]).should.be.false;
        });

        it('should process a plain import', () => {
            importGroup.processImport(file.imports[0]).should.be.true;
        });

        it('should not process a workspace import', () => {
            importGroup.processImport(file.imports[2]).should.be.false;
        });

        it('should correctly process a list of imports', () => {
            file.imports.map(i => importGroup.processImport(i)).should.deep.equal([true, true, false, false, false, false]);
        });

        it('should generate the correct typescript (asc)', () => {
            for (const imp of file.imports) {
                if (importGroup.processImport(imp)) {
                    continue;
                }
            }
            generator.generate(importGroup as any).should.equal(
                `import './workspaceSideEffectLib';\n` +
                `import 'sideEffectLib';\n`,
            );
        });

        it('should generate the correct typescript (desc)', () => {
            (importGroup as any).order = 'desc';
            for (const imp of file.imports) {
                if (importGroup.processImport(imp)) {
                    continue;
                }
            }
            generator.generate(importGroup as any).should.equal(
                `import 'sideEffectLib';\n` +
                `import './workspaceSideEffectLib';\n`,
            );
        });
    });

    describe(`keyword "Workspace"`, () => {

        beforeEach(() => {
            importGroup = new KeywordImportGroup(ImportGroupKeyword.Workspace);
        });

        it('should not process a module import', () => {
            importGroup.processImport(file.imports[4]).should.be.false;
        });

        it('should not process a plain import', () => {
            importGroup.processImport(file.imports[0]).should.be.false;
        });

        it('should process a workspace import', () => {
            importGroup.processImport(file.imports[2]).should.be.true;
        });

        it('should correctly process a list of imports', () => {
            file.imports.map(i => importGroup.processImport(i)).should.deep.equal([false, false, true, true, false, false]);
        });

        describe('when sorting by module paths', () => {
            it('should generate the correct typescript (asc)', () => {
                for (const imp of file.imports) {
                    if (importGroup.processImport(imp)) {
                        continue;
                    }
                }
                generator.generate(importGroup as any).should.equal(
                    `import { AnotherFoobar } from './anotherFile';\n` +
                    `import { Foobar } from './myFile';\n`,
                );
            });

            it('should generate the correct typescript (desc)', () => {
                (importGroup as any).order = 'desc';
                for (const imp of file.imports) {
                    if (importGroup.processImport(imp)) {
                        continue;
                    }
                }
                generator.generate(importGroup as any).should.equal(
                    `import { Foobar } from './myFile';\n` +
                    `import { AnotherFoobar } from './anotherFile';\n`,
                );
            });
        });

        describe('when sorting by first specifiers', () => {
            before(async () => {
                const config = workspace.getConfiguration('typescriptHero');
                await config.update('resolver.organizeSortsByFirstSpecifier', true);
            });

            after(async () => {
                const config = workspace.getConfiguration('typescriptHero');
                await config.update('resolver.organizeSortsByFirstSpecifier', false);
            });

            it('should generate the correct typescript (asc)', () => {
                for (const imp of specifiersFile.imports) {
                    if (importGroup.processImport(imp)) {
                        continue;
                    }
                }
                generator.generate(importGroup as any).should.equal(
                    "import { AnotherFoobarWS } from './someOtherWS';\n" +
                    "import { FoobarWS, GeneroWS } from './someWS';\n" +
                    "import ModuleFoobarWS from './myWS';\n" +
                    "import { AnotherModuleFoo as MuchFurtherSortedWS } from './anotherWS';\n"
                );
            });

            it('should generate the correct typescript (desc)', () => {
                (importGroup as any).order = 'desc';
                for (const imp of specifiersFile.imports) {
                    if (importGroup.processImport(imp)) {
                        continue;
                    }
                }
                generator.generate(importGroup as any).should.equal(
                    "import { AnotherModuleFoo as MuchFurtherSortedWS } from './anotherWS';\n" +
                    "import ModuleFoobarWS from './myWS';\n" +
                    "import { FoobarWS, GeneroWS } from './someWS';\n" +
                    "import { AnotherFoobarWS } from './someOtherWS';\n"
                );
            });
        });

    });

});
