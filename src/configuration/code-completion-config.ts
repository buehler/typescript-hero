import { Uri, workspace } from 'vscode';

const sectionKey = 'typescriptHero.codeCompletion';

export class CodeCompletionConfig {
  public completionSortMode(resource: Uri): 'default' | 'bottom' {
    return workspace.getConfiguration(sectionKey, resource).get('completionSortMode', 'default');
  }
}
