import {
  ImportGroupIdentifierInvalidError,
  ImportGroupSettingParser,
  KeywordImportGroup,
  RegexImportGroup,
} from '../../../../src/imports/import-grouping';
import { expect } from '../../setup';

describe('ImportGroupSettingParser', () => {

  it('should parse a simple keyword', () => {
    const result = ImportGroupSettingParser.parseSetting('Workspace') as KeywordImportGroup;

    expect(result).to.matchSnapshot();
  });

  it('should parse a simple regex', () => {
    const result = ImportGroupSettingParser.parseSetting('/foobar/') as RegexImportGroup;

    expect(result).to.matchSnapshot();
  });

  it('should parse a complex keyword pattern', () => {
    const result = ImportGroupSettingParser.parseSetting({
      identifier: 'Workspace',
      order: 'desc',
    }) as KeywordImportGroup;

    expect(result).to.matchSnapshot();
  });

  it('should parse a complex regex pattern', () => {
    const result = ImportGroupSettingParser.parseSetting({
      identifier: '/foobar/',
      order: 'desc',
    }) as RegexImportGroup;

    expect(result).to.matchSnapshot();
  });

  it('should throw on non found keyword and regex', () => {
    const fn = () => ImportGroupSettingParser.parseSetting('whatever');

    expect(fn).to.throw(ImportGroupIdentifierInvalidError);
  });

  it('should parse a regex with "or"', () => {
    const result = ImportGroupSettingParser.parseSetting('/angular|react/');

    expect(result).to.matchSnapshot();
  });

  it('should parse a regex with "@"', () => {
    const result = ImportGroupSettingParser.parseSetting('/@angular/');

    expect(result).to.matchSnapshot();
  });

  it('should parse a complex regex', () => {
    const result = ImportGroupSettingParser.parseSetting('/(@angular|react)/core/(.*)/');

    expect(result).to.matchSnapshot();
  });

});
