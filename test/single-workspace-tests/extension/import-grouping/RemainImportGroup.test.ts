import * as chai from 'chai';
import { join } from 'path';
import { File, TypescriptCodeGenerator, TypescriptParser } from 'typescript-parser';
import { workspace } from 'vscode';

import { TypescriptCodeGeneratorFactory } from '../../../../src/common/factories';
import { RemainImportGroup } from '../../../../src/extension/import-grouping';
import { Container } from '../../../../src/extension/IoC';
import { iocSymbols } from '../../../../src/extension/IoCSymbols';

chai.should();

describe('RemainImportGroup', () => {

    const rootPath = workspace.workspaceFolders![0].uri.fsPath;
    let file: File;
    let specifiersFile: File;
    let importGroup: RemainImportGroup;
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
        importGroup = new RemainImportGroup();
    });

    it('should process all imports', () => {
        file.imports.map(i => importGroup.processImport(i)).should.deep.equal([true, true, true, true, true, true]);
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
                `import { AnotherFoobar } from './anotherFile';\n` +
                `import { Foobar } from './myFile';\n` +
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
                `import { AnotherModuleFoo } from 'anotherLib';\n` +
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
                "import { AnotherFoobar } from 'someOtherLib';\n" +
                "import { AnotherFoobarWS } from './someOtherWS';\n" +
                "import { Foobar, Genero } from 'someLib';\n" +
                "import { FoobarWS, GeneroWS } from './someWS';\n" +
                "import ModuleFoobar from 'myLib';\n" +
                "import ModuleFoobarWS from './myWS';\n" +
                "import { AnotherModuleFoo as MuchFurtherSorted } from 'anotherLib';\n" +
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
                "import { AnotherModuleFoo as MuchFurtherSorted } from 'anotherLib';\n" +
                "import ModuleFoobarWS from './myWS';\n" +
                "import ModuleFoobar from 'myLib';\n" +
                "import { FoobarWS, GeneroWS } from './someWS';\n" +
                "import { Foobar, Genero } from 'someLib';\n" +
                "import { AnotherFoobarWS } from './someOtherWS';\n" +
                "import { AnotherFoobar } from 'someOtherLib';\n"
            );
        });
    });
});
