import * as chai from 'chai';
import { join } from 'path';
import { File, NamedImport, TypescriptCodeGenerator, TypescriptParser } from 'typescript-parser';
import { workspace } from 'vscode';

import { TypescriptCodeGeneratorFactory } from '../../../../src/common/factories';
import { RegexImportGroup } from '../../../../src/extension/import-grouping';
import { Container } from '../../../../src/extension/IoC';
import { iocSymbols } from '../../../../src/extension/IoCSymbols';

chai.should();

describe('RegexImportGroup', () => {

    const rootPath = workspace.workspaceFolders![0].uri.fsPath;
    let file: File;
    let specifiersFile: File;
    let importGroup: RegexImportGroup;
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

    beforeEach(() => {
        importGroup = new RegexImportGroup(`/Lib/`);
    });

    it('should process a matching import', () => {
        importGroup.processImport(file.imports[0]).should.be.true;
    });

    it('should not process a not matching import', () => {
        importGroup.processImport(file.imports[2]).should.be.false;
    });

    it('should correctly process a list of imports', () => {
        file.imports.map(i => importGroup.processImport(i)).should.deep.equal([true, true, false, false, true, true]);
    });

    describe('when sorting by module paths', () => {
        it('should generate the correct typescript (asc)', () => {
            for (const imp of file.imports) {
                if (importGroup.processImport(imp)) {
                    continue;
                }
            }
            generator.generate(importGroup as any).should.equal(
                `import './workspaceSideEffectLib';\n` +
                `import 'sideEffectLib';\n` +
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
                `import 'sideEffectLib';\n` +
                `import './workspaceSideEffectLib';\n` +
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

    it('should work with regex "or" conditions', () => {
        const group = new RegexImportGroup('/angular|react/');
        const imp = new NamedImport('@angular');
        const imp2 = new NamedImport('@react/core');

        group.processImport(imp).should.be.true;
        group.processImport(imp2).should.be.true;
    });

    it('should work with regex containing an "@"', () => {
        const group = new RegexImportGroup('/@angular/');
        const imp = new NamedImport('@angular');

        group.processImport(imp).should.be.true;
    });

    it('should work with slash separated regex', () => {
        const group = new RegexImportGroup('/@angular/http/');
        const imp = new NamedImport('@angular/http');
        const imp2 = new NamedImport('@angular/core/component');

        group.processImport(imp).should.be.true;
        group.processImport(imp2).should.be.false;
    });

});
