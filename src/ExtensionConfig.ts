import * as vscode from 'vscode';
import * as inversify from 'inversify';

const sectionKey = 'typescriptHero';

@inversify.injectable()
export class ExtensionConfig {
    public get pathStringDelimiter(): string {
        return vscode.workspace.getConfiguration(sectionKey).get<string>('resolver.pathStringDelimiter');
    }
}
