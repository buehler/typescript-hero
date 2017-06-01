import { RegexImportGroup } from './';
import { ImportGroup } from './ImportGroup';
import { ImportGroupIdentifierInvalidError } from './ImportGroupIdentifierInvalidError';
import { ImportGroupKeyword } from './ImportGroupKeyword';
import { ImportGroupOrder } from './ImportGroupOrder';
import { KeywordImportGroup } from './KeywordImportGroup';

/**
 * TODO
 * 
 * @export
 * @class ImportGroupSettingParser
 */
export class ImportGroupSettingParser {
    public static readonly default: ImportGroup[] = [
        new KeywordImportGroup(ImportGroupKeyword.Plains),
        new KeywordImportGroup(ImportGroupKeyword.Modules),
        new KeywordImportGroup(ImportGroupKeyword.Workspace),
    ];

    public static parseSetting(setting: string | { identifier: string, order: ImportGroupOrder }): ImportGroup {
        let identifier: string;
        let order: ImportGroupOrder = 'asc';

        if (typeof setting === 'string') {
            identifier = setting;
        } else {
            identifier = setting.identifier;
            order = setting.order;
        }

        if (/\/[A-Za-z-_0-9]+\//g.test(identifier)) {
            return new RegexImportGroup(identifier, order);
        }

        if (Object.keys(ImportGroupKeyword).indexOf(identifier) >= 0) {
            return new KeywordImportGroup(ImportGroupKeyword[identifier], order);
        }

        throw new ImportGroupIdentifierInvalidError(identifier);
    }
}
