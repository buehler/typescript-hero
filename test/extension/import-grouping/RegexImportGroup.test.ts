import * as chai from 'chai';
import { join } from 'path';
import { File, NamedImport, TypescriptCodeGenerator, TypescriptParser } from 'typescript-parser';
import { workspace } from 'vscode';

import { ExtensionConfig } from '../../../src/common/config';
import { TypescriptCodeGeneratorFactory } from '../../../src/common/factories';
import { RegexImportGroup } from '../../../src/extension/import-grouping';
import { Container } from '../../../src/extension/IoC';
import { iocSymbols } from '../../../src/extension/IoCSymbols';

chai.should();

describe('RegexImportGroup', () => {

    let file: File;
    let importGroup: RegexImportGroup;
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
