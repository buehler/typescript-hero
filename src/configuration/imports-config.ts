import { Uri, workspace } from 'vscode';

import {
  ImportGroup,
  ImportGroupSetting,
  ImportGroupSettingParser,
  RemainImportGroup,
} from '../import-organizer/import-grouping';

const sectionKey = 'typescriptHero.imports';

export default class ImportsConfig {
  public insertSpaceBeforeAndAfterImportBraces(resource: Uri): boolean {
    return workspace.getConfiguration(sectionKey, resource).get('insertSpaceBeforeAndAfterImportBraces', true);
  }

  public insertSemicolons(resource: Uri): boolean {
    return workspace.getConfiguration(sectionKey, resource).get('insertSemicolons', true);
  }

  public removeTrailingIndex(resource: Uri): boolean {
    return workspace.getConfiguration(sectionKey, resource).get('removeTrailingIndex', true);
  }

  public stringQuoteStyle(resource: Uri): '"' | '\'' {
    return workspace.getConfiguration(sectionKey, resource).get('stringQuoteStyle', `'`);
  }

  public multiLineWrapThreshold(resource: Uri): number {
    return workspace.getConfiguration(sectionKey, resource).get('multiLineWrapThreshold', 125);
  }

  public multiLineTrailingComma(resource: Uri): boolean {
    return workspace.getConfiguration(sectionKey, resource).get('multiLineTrailingComma', true);
  }

  public disableImportRemovalOnOrganize(resource: Uri): boolean {
    return workspace.getConfiguration(sectionKey, resource).get('disableImportRemovalOnOrganize', false);
  }

  public disableImportsSorting(resource: Uri): boolean {
    return workspace.getConfiguration(sectionKey, resource).get('disableImportsSorting', false);
  }

  public organizeOnSave(resource: Uri): boolean {
    return workspace.getConfiguration(sectionKey, resource).get('organizeOnSave', false);
  }

  public excludeFromSave(resource: Uri): string[] {
    return workspace.getConfiguration(sectionKey, resource).get('excludeFromSave', ['polyfill\.ts']);
  }

  public organizeSortsByFirstSpecifier(resource: Uri): boolean {
    return workspace.getConfiguration(sectionKey, resource).get('organizeSortsByFirstSpecifier', false);
  }

  public ignoredFromRemoval(resource: Uri): string[] {
    return workspace.getConfiguration(sectionKey, resource).get('ignoredFromRemoval', ['react']);
  }

  public grouping(resource: Uri): ImportGroup[] {
    const groups = workspace.getConfiguration(sectionKey, resource).get<ImportGroupSetting[]>('grouping');
    let importGroups: ImportGroup[] = [];

    try {
      if (groups) {
        importGroups = groups.map(g => ImportGroupSettingParser.parseSetting(g));
      } else {
        importGroups = ImportGroupSettingParser.default;
      }
    } catch (e) {
      importGroups = ImportGroupSettingParser.default;
    }
    if (!importGroups.some(i => i instanceof RemainImportGroup)) {
      importGroups.push(new RemainImportGroup());
    }

    return importGroups;
  }
}
