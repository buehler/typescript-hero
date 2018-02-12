import { join } from 'path';
import {
  File,
  Generatable,
  GENERATORS,
  TypescriptCodeGenerator,
  TypescriptGenerationOptions,
  TypescriptParser,
} from 'typescript-parser';
import { Uri, workspace } from 'vscode';

import { RemainImportGroup } from '../../../../src/imports/import-grouping';
import ioc from '../../../../src/ioc';
import iocSymbols, { TypescriptCodeGeneratorFactory } from '../../../../src/ioc-symbols';
import { expect } from '../../setup';

describe('RemainImportGroup', () => {

  const rootPath = workspace.workspaceFolders![0].uri.fsPath;
  const fsFile = Uri.file(
    join(rootPath, 'imports', 'import-grouping', 'imports.ts'),
  );
  let file: File;
  let importGroup: RemainImportGroup;
  let generator: TypescriptCodeGenerator;

  before(() => {
    if (!GENERATORS[RemainImportGroup.name]) {
      GENERATORS[RemainImportGroup.name] = (generatable: Generatable, options: TypescriptGenerationOptions): string => {
        const gen = new TypescriptCodeGenerator(options);
        const group = generatable as RemainImportGroup;
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
    importGroup = new RemainImportGroup();
  });

  it('should process all imports', () => {
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

});
