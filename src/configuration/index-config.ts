import { Uri, workspace } from 'vscode';

const sectionKey = 'typescriptHero.index';

export default class IndexConfig {
  public workspaceIgnorePatterns(resource: Uri): string[] {
    return workspace.getConfiguration(sectionKey, resource).get(
      'workspaceIgnorePatterns',
      [
        '**/build/**/*',
        '**/out/**/*',
        '**/dist/**/*',
      ],
    );
  }

  public moduleIgnorePatterns(resource: Uri): string[] {
    return workspace.getConfiguration(sectionKey, resource).get(
      'moduleIgnorePatterns',
      [
        '**/node_modules/**/*',
      ],
    );
  }
}
