import * as vscode from 'vscode';

const sectionKey = 'typescriptHero';

export class ExtensionConfig {
    public static get pathStringDelimiter(): string {
        return vscode.workspace.getConfiguration(sectionKey).get<string>('pathStringDelimiter');
    }
    
    // public static get organizeOnSave(): boolean {
    //     return vscode.workspace.getConfiguration(sectionKey).get<boolean>('organizeOnSave');
    // }
}
