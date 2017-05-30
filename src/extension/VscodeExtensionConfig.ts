import { ExtensionConfig, ResolverConfig, RestartDebuggerConfig } from '../common/config';
import { ImportLocation, GenerationOptions } from '../common/ts-generation';
import { injectable } from 'inversify';
import { workspace } from 'vscode';

const sectionKey = 'typescriptHero';

/**
 * Configuration class for TypeScript Hero
 * Contains all exposed config endpoints.
 * 
 * @export
 * @class VscodeExtensionConfig
 */
@injectable()
export class VscodeExtensionConfig implements ExtensionConfig {
    private resolverConfig: ResolverConfig = new VscodeResolverConfig();
    private restartDebuggerConfig: RestartDebuggerConfig = new VscodeRestartDebuggerConfig();

    /**
     * The actual log level.
     * 
     * @readonly
     * @type {string}
     * @memberOf VscodeExtensionConfig
     */
    public get verbosity(): string {
        return workspace.getConfiguration(sectionKey).get<string>('verbosity');
    }

    /**
     * Configuration object for the resolver extension.
     * 
     * @readonly
     * @type {ResolverConfig}
     * @memberOf VscodeExtensionConfig
     */
    public get resolver(): ResolverConfig {
        return this.resolverConfig;
    }

    /**
     * Configuration object for the restart debugger extension.
     * 
     * @readonly
     * @type {RestartDebuggerConfig}
     * @memberOf VscodeExtensionConfig
     */
    public get restartDebugger(): RestartDebuggerConfig {
        return this.restartDebuggerConfig;
    }
}

/**
 * Configuration class for the resolver extension.
 * 
 * @class VscodeResolverConfig
 */
class VscodeResolverConfig implements ResolverConfig {
    /**
     * Defines, if there should be a space between the brace and the import specifiers.
     * {Symbol} vs { Symbol }
     * 
     * @readonly
     * @type {boolean}
     * @memberOf VscodeResolverConfig
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
     * @memberOf VscodeResolverConfig
     */
    public get insertSemicolons(): boolean {
        return workspace.getConfiguration(sectionKey).get<boolean>('resolver.insertSemicolons');
    }

    /**
     * Defines the quote style (' or ").
     * 
     * @readonly
     * @type {string}
     * @memberOf VscodeResolverConfig
     */
    public get stringQuoteStyle(): string {
        return workspace.getConfiguration(sectionKey).get<string>('resolver.stringQuoteStyle');
    }

    /**
     * Array of string that are excluded from indexing (e.g. build, out, node_modules).
     * If those parts are found after the workspace path is striped away, the file is ignored.
     * 
     * @readonly
     * @type {string[]}
     * @memberOf VscodeResolverConfig
     */
    public get ignorePatterns(): string[] {
        return workspace.getConfiguration(sectionKey).get<string[]>('resolver.ignorePatterns');
    }

    /**
     * A length number after which the import is transformed into a multiline import.
     * 
     * @readonly
     * @type {number}
     * @memberOf VscodeResolverConfig
     */
    public get multiLineWrapThreshold(): number {
        return workspace.getConfiguration(sectionKey).get<number>('resolver.multiLineWrapThreshold');
    }

    /**
     * Where the new imports should be added (e.g. top of the file, current cursor location, etc).
     * 
     * @readonly
     * @type {ImportLocation}
     * @memberOf VscodeResolverConfig
     */
    public get newImportLocation(): ImportLocation {
        const configString = workspace.getConfiguration(sectionKey).get<string>('resolver.newImportLocation');
        return ImportLocation[configString];
    }

    /**
     * Defines, if sorting is obligatory during organize imports
     * 
     * @readonly
     * @type {boolean}
     * @memberOf ResolverConfig
     */
    public get disableImportSorting(): boolean {
        return workspace.getConfiguration(sectionKey).get<boolean>('resolver.disableImportsSorting');
    }

    /**
     * Returns the tab size that is configured in vscode.
     * 
     * @readonly
     * @type {number}
     * @memberOf VscodeResolverConfig
     */
    public get tabSize(): number {
        return workspace.getConfiguration().get<number>('editor.tabSize');
    }

    /**
     * All information that are needed to print an import.
     * 
     * @readonly
     * @type {TsImportOptions}
     * @memberOf VscodeResolverConfig
     */
    public get generationOptions(): GenerationOptions {
        return {
            eol: this.insertSemicolons ? ';' : '',
            multiLineWrapThreshold: this.multiLineWrapThreshold,
            spaceBraces: this.insertSpaceBeforeAndAfterImportBraces,
            stringQuoteStyle: this.stringQuoteStyle,
            tabSize: this.tabSize,
        };
    }
}

/**
 * Configuration class for the restart debugger extension.
 * 
 * @class VscodeRestartDebuggerConfig
 */
class VscodeRestartDebuggerConfig implements RestartDebuggerConfig {
    /**
     * Defines the folder pathes, which are watched for changes.
     * 
     * @readonly
     * @type {string[]}
     * @memberOf VscodeRestartDebuggerConfig
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
     * @memberOf VscodeRestartDebuggerConfig
     */
    public get active(): boolean {
        return workspace.getConfiguration(sectionKey).get<boolean>('restartDebugger.active');
    }
}
