import {LogLevel} from './utilities/Logger';
import {injectable} from 'inversify';
import {workspace} from 'vscode';

const sectionKey = 'typescriptHero';

@injectable()
export class ExtensionConfig {
    private resolverConfig: ResolverConfig = new ResolverConfig();
    private restartDebuggerConfig: RestartDebuggerConfig = new RestartDebuggerConfig();

    public get logLevel(): LogLevel {
        let optString = workspace.getConfiguration(sectionKey).get<string>('verbosity');
        switch (optString) {
            case 'Nothing':
                return LogLevel.Nothing;
            case 'Errors':
                return LogLevel.Errors;
            case 'All':
                return LogLevel.All;
            default:
                return LogLevel.Warnings;
        }
    }

    public get resolver(): ResolverConfig {
        return this.resolverConfig;
    }

    public get restartDebugger(): RestartDebuggerConfig {
        return this.restartDebuggerConfig;
    }
}

class ResolverConfig {
    public get pathStringDelimiter(): string {
        return workspace.getConfiguration(sectionKey).get<string>('resolver.pathStringDelimiter');
    }
}

class RestartDebuggerConfig {
    public get watchFolders(): string[] {
        return workspace.getConfiguration(sectionKey).get<string[]>('restartDebugger.watchFolders');
    }

    public get active(): boolean {
        return workspace.getConfiguration(sectionKey).get<boolean>('restartDebugger.active');
    }
}
