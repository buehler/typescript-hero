import { ImportGroup } from './ImportGroup';
import { ImportGroupIdentifierInvalidError } from './ImportGroupIdentifierInvalidError';
import { ImportGroupKeyword } from './ImportGroupKeyword';
import { ImportGroupOrder } from './ImportGroupOrder';
import { KeywordImportGroup } from './KeywordImportGroup';
import { RegexImportGroup } from './RegexImportGroup';
import { RemainImportGroup } from './RemainImportGroup';

/**
 * TODO
 */
export type ImportGroupSetting = string | { identifier: string, order: ImportGroupOrder };

/**
 * TODO
 * 
 * @export
 * @class ImportGroupSettingParser
 */
export class ImportGroupSettingParser {
    public static get default(): ImportGroup[] {
        return [
            new KeywordImportGroup(ImportGroupKeyword.Plains),
            new KeywordImportGroup(ImportGroupKeyword.Modules),
            new KeywordImportGroup(ImportGroupKeyword.Workspace),
            new RemainImportGroup(),
        ];
    }

    public static parseSetting(setting: ImportGroupSetting): ImportGroup {
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

        if (ImportGroupKeyword[identifier] !== undefined) {
            return new KeywordImportGroup(ImportGroupKeyword[identifier], order);
        }

        throw new ImportGroupIdentifierInvalidError(identifier);
    }
}
