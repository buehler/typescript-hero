import * as chai from 'chai';
import { join } from 'path';
import { File, TypescriptCodeGenerator, TypescriptParser } from 'typescript-parser';
import { workspace } from 'vscode';

import { ExtensionConfig } from '../../../src/common/config';
import { TypescriptCodeGeneratorFactory } from '../../../src/common/factories';
import { RemainImportGroup } from '../../../src/extension/import-grouping';
import { Container } from '../../../src/extension/IoC';
import { iocSymbols } from '../../../src/extension/IoCSymbols';

chai.should();

describe('RemainImportGroup', () => {

    let file: File;
    let importGroup: RemainImportGroup;
    let config: ExtensionConfig;
    let generator: TypescriptCodeGenerator;

    before(async () => {
        const parser = Container.get<TypescriptParser>(iocSymbols.typescriptParser);
        config = Container.get<ExtensionConfig>(iocSymbols.configuration);
        generator = Container.get<TypescriptCodeGeneratorFactory>(iocSymbols.generatorFactory)();
        file = await parser.parseFile(
            join(
                workspace.rootPath!,
                'extension/import-grouping/imports.ts',
            ),
            workspace.rootPath!,
        );
    });

    beforeEach(() => {
        importGroup = new RemainImportGroup();
    });

    it('should process all imports', () => {
        file.imports.map(i => importGroup.processImport(i)).should.deep.equal([true, true, true, true, true, true]);
    });

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
