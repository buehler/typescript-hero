import * as chai from 'chai';
chai.should();

import { KeywordImportGroup, ImportGroupKeyword, RegexImportGroup } from '../../../../src/extension/import-grouping';
import { importGroupSortForPrecedence } from '../../../../src/extension/utilities/utilityFunctions';

describe('utilityFunctions', () => {
  describe('importGroupSortForPrecedence', () => {
    it('should prioritize regexes, leaving original order untouched besides that', () => {
      const initialList = [
        new KeywordImportGroup(ImportGroupKeyword.Modules),
        new KeywordImportGroup(ImportGroupKeyword.Plains),
        new RegexImportGroup("/cool-library/"),
        new RegexImportGroup("/cooler-library/"),
        new KeywordImportGroup(ImportGroupKeyword.Workspace),
      ]
      const expectedList = initialList.slice(2, 4)
        .concat(initialList.slice(0, 2))
        .concat(initialList.slice(4))

      importGroupSortForPrecedence(initialList).should.deep.equal(expectedList,
        'Regex Import Groups should appear first (and that should be the only change)')
    });
  });
});
