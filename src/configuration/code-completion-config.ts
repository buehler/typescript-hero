import { workspace } from 'vscode';

const sectionKey = 'typescriptHero.codeCompletion';

export class CodeCompletionConfig {
  public isEnabled(): 'default' | 'bottom' {
    return workspace.getConfiguration(sectionKey).get('completionSortMode', 'default');
  }
}
