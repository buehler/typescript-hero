import { iocSymbols } from '../../../src/extension/IoCSymbols';
import { ExtensionConfig } from '../../../src/common/config';
import { TypescriptParser } from '../../../src/common/ts-parsing';
import { File } from '../../../src/common/ts-parsing/resources';
import { ImportGroupKeyword, KeywordImportGroup } from '../../../src/extension/import-grouping';
import { Container } from '../../../src/extension/IoC';
import * as chai from 'chai';
import { join } from 'path';
import { workspace } from 'vscode';

chai.should();

describe.only('KeywordImportGroup', () => {

    let file: File;
    let importGroup: KeywordImportGroup;
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

        it('should generate the correct typescript (asc)', () => {
            for (const imp of file.imports) {
                if (importGroup.processImport(imp)) {
                    continue;
                }
            }
            importGroup.generateTypescript(config.resolver.generationOptions).should.equal(
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
                `import { ModuleFoobar } from 'myLib';\n` +
                `import { AnotherModuleFoo } from 'anotherLib';\n`,
            );
        });

    });

    describe(`keyword "Plains"`, () => { });

    describe(`keyword "Workspace"`, () => { });

});
