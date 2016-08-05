import {injectable} from 'inversify';
import * as vscode from 'vscode';

const sectionKey = 'typescriptHero';

@injectable()
export class ExtensionConfig {
    private resolverConfig: ResolverConfig = new ResolverConfig();
    private restartDebuggerConfig: RestartDebuggerConfig = new RestartDebuggerConfig();

    public get resolver(): ResolverConfig {
        return this.resolverConfig;
    }

    public get restartDebugger(): RestartDebuggerConfig {
        return this.restartDebuggerConfig;
    }
}

class ResolverConfig {
    public get pathStringDelimiter(): string {
        return vscode.workspace.getConfiguration(sectionKey).get<string>('resolver.pathStringDelimiter');
    }
}

class RestartDebuggerConfig {
    public get watchFolders(): string[] {
        return vscode.workspace.getConfiguration(sectionKey).get<string[]>('restartDebugger.watchFolders');
    }

    public get active(): boolean {
        return vscode.workspace.getConfiguration(sectionKey).get<boolean>('restartDebugger.active');
    }
}
