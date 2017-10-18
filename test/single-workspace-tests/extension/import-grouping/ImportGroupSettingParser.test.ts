import {
    ImportGroupIdentifierInvalidError,
    ImportGroupKeyword,
    ImportGroupSettingParser,
    KeywordImportGroup,
    RegexImportGroup,
} from '../../../src/extension/import-grouping';
import * as chai from 'chai';

chai.should();

describe('ImportGroupSettingParser', () => {

    it('should parse a simple keyword', () => {
        const result = ImportGroupSettingParser.parseSetting('Workspace') as KeywordImportGroup;

        result.keyword.should.equal(ImportGroupKeyword.Workspace);
        result.order.should.equal('asc');
    });

    it('should parse a simple regex', () => {
        const result = ImportGroupSettingParser.parseSetting('/foobar/') as RegexImportGroup;

        result.regex.should.equal('/foobar/');
        result.order.should.equal('asc');
    });

    it('should parse a complex keyword pattern', () => {
        const result = ImportGroupSettingParser.parseSetting({
            identifier: 'Workspace',
            order: 'desc',
        }) as KeywordImportGroup;

        result.keyword.should.equal(ImportGroupKeyword.Workspace);
        result.order.should.equal('desc');
    });

    it('should parse a complex regex pattern', () => {
        const result = ImportGroupSettingParser.parseSetting({
            identifier: '/foobar/',
            order: 'desc',
        }) as RegexImportGroup;

        result.regex.should.equal('/foobar/');
        result.order.should.equal('desc');
    });

    it('should throw on non found keyword and regex', () => {
        const fn = () => ImportGroupSettingParser.parseSetting('whatever');

        fn.should.throw(ImportGroupIdentifierInvalidError);
    });

    it('should parse a regex with "or"', () => {
        const result = ImportGroupSettingParser.parseSetting('/angular|react/');

        result.should.be.an.instanceof(RegexImportGroup);
        (result as RegexImportGroup).regex.should.equal('/angular|react/');
    });

    it('should parse a regex with "@"', () => {
        const result = ImportGroupSettingParser.parseSetting('/@angular/');

        result.should.be.an.instanceof(RegexImportGroup);
        (result as RegexImportGroup).regex.should.equal('/@angular/');
    });

    it('should parse a complex regex', () => {
        const result = ImportGroupSettingParser.parseSetting('/(@angular|react)/core/(.*)/');

        result.should.be.an.instanceof(RegexImportGroup);
        (result as RegexImportGroup).regex.should.equal('/(@angular|react)/core/(.*)/');
    });

});
