import { join } from 'path';
import { TypescriptParser } from 'typescript-parser';
import { workspace } from 'vscode';

import { ImportGroupKeyword, KeywordImportGroup, RegexImportGroup } from '../../../src/imports/import-grouping';
import ioc from '../../../src/ioc';
import iocSymbols from '../../../src/ioc-symbols';
import {
  getImportInsertPosition,
  importGroupSortForPrecedence,
  importSortByFirstSpecifier,
} from '../../../src/utilities/utility-functions';
import { expect } from '../setup';

describe('utility functions', () => {

  describe('getImportInsertPosition()', () => {

    class MockDocument {
      constructor(private documentText: string) { }

      public getText(): string {
        return this.documentText;
      }
    }

    it('should return top position if no editor is specified', () => {
      const pos = getImportInsertPosition(undefined);
      expect(pos).to.matchSnapshot();
    });

    it('should return the top position if empty file', () => {
      const pos = getImportInsertPosition({
        document: new MockDocument(''),
      } as any);
      expect(pos).to.matchSnapshot();
    });

    it('should return correct position for commented file', () => {
      const pos = getImportInsertPosition({
        document: new MockDocument('    // This is a file header\nStart of file\n'),
      } as any);
      expect(pos).to.matchSnapshot();
    });

    it('should return correct position for use strict', () => {
      const pos = getImportInsertPosition({
        document: new MockDocument(`'use strict'\nStart of file\n`),
      } as any);
      expect(pos).to.matchSnapshot();
    });

    it('should return correct position for jsdoc comment open', () => {
      const pos = getImportInsertPosition({
        document: new MockDocument('/** start of a jsdoc\n'),
      } as any);
      expect(pos).to.matchSnapshot();
    });

    it('should return correct position for jsdoc comment line', () => {
      const pos = getImportInsertPosition({
        document: new MockDocument(' * jsdoc line\n'),
      } as any);
      expect(pos).to.matchSnapshot();
    });

    it('should return correct position for jsdoc comment close', () => {
      const pos = getImportInsertPosition({
        document: new MockDocument('*/\n'),
      } as any);
      expect(pos).to.matchSnapshot();
    });

  });

  describe('importGroupSortForPrecedence', () => {

    it('should prioritize regexes, leaving original order untouched besides that', () => {
      const initialList = [
        new KeywordImportGroup(ImportGroupKeyword.Modules),
        new KeywordImportGroup(ImportGroupKeyword.Plains),
        new RegexImportGroup('/cool-library/'),
        new RegexImportGroup('/cooler-library/'),
        new KeywordImportGroup(ImportGroupKeyword.Workspace),
      ];
      const expectedList = initialList
        .slice(2, 4)
        .concat(initialList.slice(0, 2))
        .concat(initialList.slice(4));

      expect(importGroupSortForPrecedence(initialList)).to.deep.equal(
        expectedList,
        'Regex Import Groups should appear first (and that should be the only change)',
      );
    });

  });

  describe('importSortByFirstSpecifier', () => {
    const parser = ioc.get<TypescriptParser>(iocSymbols.parser);
    const rootPath = workspace.workspaceFolders![0].uri.fsPath;

    it('should sort according to first specifier/alias, falling back to module path', async () => {
      const file = await parser.parseFile(
        join(
          rootPath,
          'utilities',
          'imports-for-specifier-sort.ts',
        ),
        rootPath,
      );

      const result = [...file.imports].sort(importSortByFirstSpecifier);
      expect(result.map(i => i.libraryName)).to.matchSnapshot();
    });
  });

});
