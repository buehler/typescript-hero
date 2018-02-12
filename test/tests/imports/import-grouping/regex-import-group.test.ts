import { join } from 'path';
import {
  File,
  Generatable,
  GENERATORS,
  NamedImport,
  TypescriptCodeGenerator,
  TypescriptGenerationOptions,
  TypescriptParser,
} from 'typescript-parser';
import { Uri, workspace } from 'vscode';

import { RegexImportGroup } from '../../../../src/imports/import-grouping';
import ioc from '../../../../src/ioc';
import iocSymbols, { TypescriptCodeGeneratorFactory } from '../../../../src/ioc-symbols';
import { expect } from '../../setup';

describe('RegexImportGroup', () => {

  const rootPath = workspace.workspaceFolders![0].uri.fsPath;
  const fsFile = Uri.file(
    join(rootPath, 'imports', 'import-grouping', 'imports.ts'),
  );
  let file: File;
  let importGroup: RegexImportGroup;
  let generator: TypescriptCodeGenerator;

  before(() => {
    if (!GENERATORS[RegexImportGroup.name]) {
      GENERATORS[RegexImportGroup.name] = (generatable: Generatable, options: TypescriptGenerationOptions): string => {
        const gen = new TypescriptCodeGenerator(options);
        const group = generatable as RegexImportGroup;
        if (!group.imports.length) {
          return '';
        }
        return group.sortedImports
          .map(imp => gen.generate(imp))
          .join('\n') + '\n';
      };
    }
  });

  before(async () => {
    const parser = ioc.get<TypescriptParser>(iocSymbols.parser);
    generator = ioc.get<TypescriptCodeGeneratorFactory>(iocSymbols.generatorFactory)(fsFile);
    file = await parser.parseFile(fsFile.fsPath, rootPath);
  });

  beforeEach(() => {
    importGroup = new RegexImportGroup(`/Lib/`);
  });

  it('should process a matching import', () => {
    expect(importGroup.processImport(file.imports[0])).to.be.true;
  });

  it('should not process a not matching import', () => {
    expect(importGroup.processImport(file.imports[2])).to.be.false;
  });

  it('should correctly process a list of imports', () => {
    expect(file.imports.map(i => importGroup.processImport(i))).to.matchSnapshot();
  });

  it('should generate the correct typescript (asc)', () => {
    for (const imp of file.imports) {
      if (importGroup.processImport(imp)) {
        continue;
      }
    }
    expect(generator.generate(importGroup as any)).to.matchSnapshot();
  });

  it('should generate the correct typescript (desc)', () => {
    (importGroup as any).order = 'desc';
    for (const imp of file.imports) {
      if (importGroup.processImport(imp)) {
        continue;
      }
    }
    expect(generator.generate(importGroup as any)).to.matchSnapshot();
  });

  it('should work with regex "or" conditions', () => {
    const group = new RegexImportGroup('/angular|react/');
    const imp = new NamedImport('@angular');
    const imp2 = new NamedImport('@react/core');

    expect(group.processImport(imp)).to.be.true;
    expect(group.processImport(imp2)).to.be.true;
  });

  it('should work with regex containing an "@"', () => {
    const group = new RegexImportGroup('/@angular/');
    const imp = new NamedImport('@angular');

    expect(group.processImport(imp)).to.be.true;
  });

  it('should work with slash separated regex', () => {
    const group = new RegexImportGroup('/@angular/http/');
    const imp = new NamedImport('@angular/http');
    const imp2 = new NamedImport('@angular/core/component');

    expect(group.processImport(imp)).to.be.true;
    expect(group.processImport(imp2)).to.be.false;
  });

});
