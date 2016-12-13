import { ImportLocation, TsImportOptions } from './models/TsImportOptions';
import { LogLevel } from './utilities/Logger';
import { injectable } from 'inversify';
import { workspace } from 'vscode';

const sectionKey = 'typescriptHero';

/**
 * Configuration class for TypeScript Hero
 * Contains all exposed config endpoints.
 * 
 * @export
 * @class ExtensionConfig
 */
@injectable()
export class ExtensionConfig {
    private resolverConfig: ResolverConfig = new ResolverConfig();
    private restartDebuggerConfig: RestartDebuggerConfig = new RestartDebuggerConfig();

    /**
     * The actual log level.
     * 
     * @readonly
     * @type {LogLevel}
     * @memberOf ExtensionConfig
     */
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

    /**
     * Configuration object for the resolver extension.
     * 
     * @readonly
     * @type {ResolverConfig}
     * @memberOf ExtensionConfig
     */
    public get resolver(): ResolverConfig {
        return this.resolverConfig;
    }

    /**
     * Configuration object for the restart debugger extension.
     * 
     * @readonly
     * @type {RestartDebuggerConfig}
     * @memberOf ExtensionConfig
     */
    public get restartDebugger(): RestartDebuggerConfig {
        return this.restartDebuggerConfig;
    }
}

/**
 * Configuration class for the resolver extension.
 * 
 * @class ResolverConfig
 */
class ResolverConfig {
    /**
     * Defines, if there should be a space between the brace and the import specifiers.
     * {Symbol} vs { Symbol }
     * 
     * @readonly
     * @type {boolean}
     * @memberOf ResolverConfig
     */
    public get insertSpaceBeforeAndAfterImportBraces(): boolean {
        return workspace.getConfiguration(sectionKey).get<boolean>('resolver.insertSpaceBeforeAndAfterImportBraces');
    }

    /**
     * Defines, if there should be a semicolon at the end of a statement.
     * import Symbol from 'symbol' vs import Symbol from 'symbol';
     * 
     * @readonly
     * @type {boolean}
     * @memberOf ResolverConfig
     */
    public get insertSemicolons(): boolean {
        return workspace.getConfiguration(sectionKey).get<boolean>('resolver.insertSemicolons');
    }

    /**
     * Defines the quote style (' or ").
     * 
     * @readonly
     * @type {string}
     * @memberOf ResolverConfig
     */
    public get pathStringDelimiter(): string {
        return workspace.getConfiguration(sectionKey).get<string>('resolver.pathStringDelimiter');
    }

    /**
     * Array of string that are excluded from indexing (e.g. build, out, node_modules).
     * If those parts are found after the workspace path is striped away, the file is ignored.
     * 
     * @readonly
     * @type {string[]}
     * @memberOf ResolverConfig
     */
    public get ignorePatterns(): string[] {
        return workspace.getConfiguration(sectionKey).get<string[]>('resolver.ignorePatterns');
    }

    /**
     * A length number after which the import is transformed into a multiline import.
     * 
     * @readonly
     * @type {number}
     * @memberOf ResolverConfig
     */
    public get multiLineWrapThreshold(): number {
        return workspace.getConfiguration(sectionKey).get<number>('resolver.multiLineWrapThreshold');
    }

    /**
     * Where the new imports should be added (e.g. top of the file, current cursor location, etc).
     * 
     * @readonly
     * @type {ImportLocation}
     * @memberOf ResolverConfig
     */
    public get newImportLocation(): ImportLocation {
        let configString = workspace.getConfiguration(sectionKey).get<string>('resolver.newImportLocation');
        return ImportLocation[configString];
    }

    /**
     * Returns the tab size that is configured in vscode.
     * 
     * @readonly
     * @type {number}
     * @memberOf ResolverConfig
     */
    public get tabSize(): number {
        return workspace.getConfiguration().get<number>('editor.tabSize');
    }

    /**
     * All information that are needed to print an import.
     * 
     * @readonly
     * @type {TsImportOptions}
     * @memberOf ResolverConfig
     */
    public get importOptions(): TsImportOptions {
        return {
            eol: this.insertSemicolons ? ';' : '',
            multiLineWrapThreshold: this.multiLineWrapThreshold,
            pathDelimiter: this.pathStringDelimiter,
            spaceBraces: this.insertSpaceBeforeAndAfterImportBraces,
            tabSize: this.tabSize
        };
    }
}

/**
 * Configuration class for the restart debugger extension.
 * 
 * @class RestartDebuggerConfig
 */
class RestartDebuggerConfig {
    /**
     * Defines the folder pathes, which are watched for changes.
     * 
     * @readonly
     * @type {string[]}
     * @memberOf RestartDebuggerConfig
     */
    public get watchFolders(): string[] {
        return workspace.getConfiguration(sectionKey).get<string[]>('restartDebugger.watchFolders');
    }

    /**
     * Returns the active state that is configured.
     * When true, the restarter is started on startup, otherwise it's deactivated by default.
     * 
     * @readonly
     * @type {boolean}
     * @memberOf RestartDebuggerConfig
     */
    public get active(): boolean {
        return workspace.getConfiguration(sectionKey).get<boolean>('restartDebugger.active');
    }
}
