import * as vscode from 'vscode';

const sectionKey = 'typescriptHero';

export class Configuration {
    public static get pathStringDelimiter(): string {
        return vscode.workspace.getConfiguration(sectionKey).get<string>('pathStringDelimiter');
    }

    public static get includeNodeModules(): boolean {
        return vscode.workspace.getConfiguration(sectionKey).get<boolean>('includeNodeModules');
    }

    public static get includeTypings(): boolean {
        return vscode.workspace.getConfiguration(sectionKey).get<boolean>('includeTypings');
    }

    public static get refreshOnSave(): boolean {
        return vscode.workspace.getConfiguration(sectionKey).get<boolean>('refreshOnSave');
    }

    // public static get organizeOnSave(): boolean {
    //     return vscode.workspace.getConfiguration(sectionKey).get<boolean>('organizeOnSave');
    // }

    public static get debug(): boolean {
        return vscode.workspace.getConfiguration(sectionKey).get<boolean>('debug');
    }
}
