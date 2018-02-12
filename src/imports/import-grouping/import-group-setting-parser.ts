import { ImportGroup } from './import-group';
import { ImportGroupIdentifierInvalidError } from './import-group-identifier-invalid-error';
import { ImportGroupKeyword } from './import-group-keyword';
import { ImportGroupOrder } from './import-group-order';
import { KeywordImportGroup } from './keyword-import-group';
import { RegexImportGroup } from './regex-import-group';
import { RemainImportGroup } from './remain-import-group';

/**
 * Inserted setting that is contained in the settings.json of .vscode.
 */
export type ImportGroupSetting = string | { identifier: string, order: ImportGroupOrder };

const REGEX_REGEX_GROUP = /^\/.+\/$/;

/**
 * Parser that takes the vscode - setting and creates import groups out of it.
 * Contains a default if the parsing fails.
 *
 * @export
 * @class ImportGroupSettingParser
 */
export class ImportGroupSettingParser {
  /**
   * Default value for the import groups.
   * Contains the following:
   *  - Plain imports
   *  - Module imports
   *  - Workspace imports
   *
   * @readonly
   * @static
   * @type {ImportGroup[]}
   * @memberof ImportGroupSettingParser
   */
  public static get default(): ImportGroup[] {
    return [
      new KeywordImportGroup(ImportGroupKeyword.Plains),
      new KeywordImportGroup(ImportGroupKeyword.Modules),
      new KeywordImportGroup(ImportGroupKeyword.Workspace),
      new RemainImportGroup(),
    ];
  }

  /**
   * Function that takes a string or object ({@link ImportGroupSetting}) and parses an import group out of it.
   *
   * @static
   * @param {ImportGroupSetting} setting
   * @returns {ImportGroup}
   * @throws {ImportGroupIdentifierInvalidError} When the identifier is invalid (neither keyword nor valid regex)
   *
   * @memberof ImportGroupSettingParser
   */
  public static parseSetting(setting: ImportGroupSetting): ImportGroup {
    let identifier: string;
    let order: ImportGroupOrder = 'asc';

    if (typeof setting === 'string') {
      identifier = setting;
    } else {
      identifier = setting.identifier;
      order = setting.order;
    }

    if (REGEX_REGEX_GROUP.test(identifier)) {
      return new RegexImportGroup(identifier, order);
    }

    if (ImportGroupKeyword[identifier] === ImportGroupKeyword.Remaining) {
      return new RemainImportGroup(order);
    }

    if (ImportGroupKeyword[identifier] !== undefined) {
      return new KeywordImportGroup(ImportGroupKeyword[identifier], order);
    }

    throw new ImportGroupIdentifierInvalidError(identifier);
  }
}
