import { ExtensionConfig } from '../../../src/common/config';
import { TypescriptParser } from '../../../src/common/ts-parsing';
import { File } from '../../../src/common/ts-parsing/resources';
import { RegexImportGroup } from '../../../src/extension/import-grouping';
import { Container } from '../../../src/extension/IoC';
import { iocSymbols } from '../../../src/extension/IoCSymbols';
import * as chai from 'chai';
import { join } from 'path';
import { workspace } from 'vscode';

chai.should();

describe('RegexImportGroup', () => {

    let file: File;
    let importGroup: RegexImportGroup;
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

    it('should generate the correct typescript (asc)', () => {
        for (const imp of file.imports) {
            if (importGroup.processImport(imp)) {
                continue;
            }
        }
        importGroup.generateTypescript(config.resolver.generationOptions).should.equal(
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
        importGroup.generateTypescript(config.resolver.generationOptions).should.equal(
            `import 'sideEffectLib';\n` +
            `import './workspaceSideEffectLib';\n` +
            `import { ModuleFoobar } from 'myLib';\n` +
            `import { AnotherModuleFoo } from 'anotherLib';\n`,
        );
    });

});
