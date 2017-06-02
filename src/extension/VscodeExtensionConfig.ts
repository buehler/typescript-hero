import { ExtensionConfig, ResolverConfig } from '../common/config';
import { GenerationOptions, ImportLocation } from '../common/ts-generation';
import { ImportGroup, ImportGroupSetting, ImportGroupSettingParser } from './import-grouping';
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

    /**
     * The actual log level.
     * 
     * @readonly
     * @type {string}
     * @memberof VscodeExtensionConfig
     */
    public get verbosity(): string {
        return workspace.getConfiguration(sectionKey).get<string>('verbosity');
    }

    /**
     * Configuration object for the resolver extension.
     * 
     * @readonly
     * @type {ResolverConfig}
     * @memberof VscodeExtensionConfig
     */
    public get resolver(): ResolverConfig {
        return this.resolverConfig;
    }
}

/**
 * Configuration class for the resolver extension.
 * 
 * @class VscodeResolverConfig
 */
class VscodeResolverConfig implements ResolverConfig {
    private parsedImportGroups: ImportGroup[] | null = null;

    /**
     * Defines, if there should be a space between the brace and the import specifiers.
     * {Symbol} vs { Symbol }
     * 
     * @readonly
     * @type {boolean}
     * @memberof VscodeResolverConfig
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
     * @memberof VscodeResolverConfig
     */
    public get insertSemicolons(): boolean {
        return workspace.getConfiguration(sectionKey).get<boolean>('resolver.insertSemicolons');
    }

    /**
     * Defines the quote style (' or ").
     * 
     * @readonly
     * @type {string}
     * @memberof VscodeResolverConfig
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
     * @memberof VscodeResolverConfig
     */
    public get ignorePatterns(): string[] {
        return workspace.getConfiguration(sectionKey).get<string[]>('resolver.ignorePatterns');
    }

    /**
     * A length number after which the import is transformed into a multiline import.
     * 
     * @readonly
     * @type {number}
     * @memberof VscodeResolverConfig
     */
    public get multiLineWrapThreshold(): number {
        return workspace.getConfiguration(sectionKey).get<number>('resolver.multiLineWrapThreshold');
    }

    /**
     * Where the new imports should be added (e.g. top of the file, current cursor location, etc).
     * 
     * @readonly
     * @type {ImportLocation}
     * @memberof VscodeResolverConfig
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
     * @memberof ResolverConfig
     */
    public get disableImportSorting(): boolean {
        return workspace.getConfiguration(sectionKey).get<boolean>('resolver.disableImportsSorting');
    }

    /**
     * Returns the tab size that is configured in vscode.
     * 
     * @readonly
     * @type {number}
     * @memberof VscodeResolverConfig
     */
    public get tabSize(): number {
        return workspace.getConfiguration().get<number>('editor.tabSize');
    }

    /**
     * Returns the configured import groups. On a parsing error, the default is used.
     * 
     * @type {ImportGroup[]}
     * @memberof VscodeResolverConfig
     */
    public get importGroups(): ImportGroup[] {
        if (this.parsedImportGroups !== null) {
            return this.parsedImportGroups;
        }

        this.parsedImportGroups = [];
        const groups = workspace.getConfiguration(sectionKey).get<ImportGroupSetting[]>('resolver.importGroups');

        try {
            this.parsedImportGroups = groups.map(g => ImportGroupSettingParser.parseSetting(g));
        } catch (e) {
            this.parsedImportGroups = ImportGroupSettingParser.default;
        }

        return this.parsedImportGroups;
    }

    /**
     * All information that are needed to print an import.
     * 
     * @readonly
     * @type {TsImportOptions}
     * @memberof VscodeResolverConfig
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

    constructor() {
        workspace.onDidChangeConfiguration(() => this.parsedImportGroups = null);
    }
}
