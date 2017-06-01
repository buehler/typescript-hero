import { ExtensionConfig } from '../../../src/common/config';
import { TypescriptParser } from '../../../src/common/ts-parsing';
import { File } from '../../../src/common/ts-parsing/resources';
import { RemainImportGroup } from '../../../src/extension/import-grouping';
import { Container } from '../../../src/extension/IoC';
import { iocSymbols } from '../../../src/extension/IoCSymbols';
import * as chai from 'chai';
import { join } from 'path';
import { workspace } from 'vscode';

chai.should();

describe('RemainImportGroup', () => {

    let file: File;
    let importGroup: RemainImportGroup;
    let config: ExtensionConfig;

    before(async () => {
        const parser = Container.get(TypescriptParser);
        config = Container.get<ExtensionConfig>(iocSymbols.configuration);
        file = await parser.parseFile(
            join(
                workspace.rootPath,
                'extension/import-grouping/imports.ts',
            ),
            workspace.rootPath,
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
        importGroup.generateTypescript(config.resolver.generationOptions).should.equal(
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
        importGroup.generateTypescript(config.resolver.generationOptions).should.equal(
            `import 'sideEffectLib';\n` +
            `import './workspaceSideEffectLib';\n` +
            `import { ModuleFoobar } from 'myLib';\n` +
            `import { AnotherModuleFoo } from 'anotherLib';\n` +
            `import { Foobar } from './myFile';\n` +
            `import { AnotherFoobar } from './anotherFile';\n`,
        );
    });

});
