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

import { ImportGroupKeyword, KeywordImportGroup } from '../../../../src/imports/import-grouping';
import ioc from '../../../../src/ioc';
import iocSymbols, { TypescriptCodeGeneratorFactory } from '../../../../src/ioc-symbols';
import { expect } from '../../setup';

describe('KeywordImportGroup', () => {

  const rootPath = workspace.workspaceFolders![0].uri.fsPath;
  const fsFile = Uri.file(
    join(rootPath, 'imports', 'import-grouping', 'imports.ts'),
  );
  let file: File;
  let importGroup: KeywordImportGroup;
  let generator: TypescriptCodeGenerator;

  before(() => {
    if (!GENERATORS[KeywordImportGroup.name]) {
      GENERATORS[KeywordImportGroup.name] = (generatable: Generatable, options: TypescriptGenerationOptions): string => {
        const gen = new TypescriptCodeGenerator(options);
        const group = generatable as KeywordImportGroup;
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

  describe(`keyword "Modules"`, () => {

    beforeEach(() => {
      importGroup = new KeywordImportGroup(ImportGroupKeyword.Modules);
    });

    it('should process a module import', () => {
      expect(importGroup.processImport(file.imports[4])).to.be.true;
    });

    it('should not process a plain import', () => {
      expect(importGroup.processImport(file.imports[0])).to.be.false;
    });

    it('should not process a workspace import', () => {
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

  });

  describe(`keyword "Plains"`, () => {

    beforeEach(() => {
      importGroup = new KeywordImportGroup(ImportGroupKeyword.Plains);
    });

    it('should not process a module import', () => {
      expect(importGroup.processImport(file.imports[4])).to.be.false;
    });

    it('should process a plain import', () => {
      expect(importGroup.processImport(file.imports[0])).to.be.true;
    });

    it('should not process a workspace import', () => {
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

  });

  describe(`keyword "Workspace"`, () => {

    beforeEach(() => {
      importGroup = new KeywordImportGroup(ImportGroupKeyword.Workspace);
    });

    it('should not process a module import', () => {
      expect(importGroup.processImport(file.imports[4])).to.be.false;
    });

    it('should not process a plain import', () => {
      expect(importGroup.processImport(file.imports[0])).to.be.false;
    });

    it('should process a workspace import', () => {
      expect(importGroup.processImport(file.imports[2])).to.be.true;
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

  });

});
