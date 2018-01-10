import { workspace } from 'vscode';

const sectionKey = 'typescriptHero.codeOutline';

export default class DocumentOutlineConfig {
  public isEnabled(): boolean {
    return workspace.getConfiguration(sectionKey).get('enabled', true);
  }
}
