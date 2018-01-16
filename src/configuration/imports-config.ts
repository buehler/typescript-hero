import { Uri, workspace } from 'vscode';

const sectionKey = 'typescriptHero.imports';

export default class ImportsConfig {
  public insertSpaceBeforeAndAfterImportBraces(resource: Uri): boolean {
    return workspace.getConfiguration(sectionKey, resource).get('insertSpaceBeforeAndAfterImportBraces', true);
  }

  public insertSemicolons(resource: Uri): boolean {
    return workspace.getConfiguration(sectionKey, resource).get('insertSemicolons', true);
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

  public organizeOnSave(resource: Uri): boolean {
    return workspace.getConfiguration(sectionKey, resource).get('organizeOnSave', false);
  }

  public ignoredFromRemoval(resource: Uri): string[] {
    return workspace.getConfiguration(sectionKey, resource).get('ignoredFromRemoval', ['react']);
  }

  public grouping(resource: Uri): void {
    // const groups = this.workspaceSection.get<ImportGroupSetting[]>('importGroups');
    // let importGroups: ImportGroup[] = [];

    // try {
    //   if (groups) {
    //     importGroups = groups.map(g => ImportGroupSettingParser.parseSetting(g));
    //   } else {
    //     importGroups = ImportGroupSettingParser.default;
    //   }
    // } catch (e) {
    //   importGroups = ImportGroupSettingParser.default;
    // }
    // if (!importGroups.some(i => i instanceof RemainImportGroup)) {
    //   importGroups.push(new RemainImportGroup());
    // }

    // return importGroups;
  }
}
