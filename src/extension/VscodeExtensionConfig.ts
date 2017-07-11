import { injectable } from 'inversify';
import { TypescriptGenerationOptions } from 'typescript-parser';
import { workspace } from 'vscode';

import { ExtensionConfig, ResolverConfig } from '../common/config';
import { CodeOutlineConfig } from '../common/config/CodeOutlineConfig';
import { ImportGroup, ImportGroupSetting, ImportGroupSettingParser, RemainImportGroup } from './import-grouping';

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
    private codeOutlineConfig: CodeOutlineConfig = new VscodeCodeOutlineConfig();

    /**
     * The actual log level.
     * 
     * @readonly
     * @type {string}
     * @memberof VscodeExtensionConfig
     */
    public get verbosity(): string {
        return workspace.getConfiguration(sectionKey).get<string>('verbosity') || 'Warning';
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

    /**
     * Configuration object for the code outline extension.
     * 
     * @readonly
     * @type {CodeOutlineConfig}
     * @memberof VscodeExtensionConfig
     */
    public get codeOutline(): CodeOutlineConfig {
        return this.codeOutlineConfig;
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
     * @memberof VscodeResolverConfig
     */
    public get insertSpaceBeforeAndAfterImportBraces(): boolean {
        const value = workspace.getConfiguration(sectionKey).get<boolean>('resolver.insertSpaceBeforeAndAfterImportBraces');
        return value !== undefined ? value : true;
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
        const value = workspace.getConfiguration(sectionKey).get<boolean>('resolver.insertSemicolons');
        return value !== undefined ? value : true;
    }

    /**
     * Defines the quote style (' or ").
     * 
     * @readonly
     * @type {string}
     * @memberof VscodeResolverConfig
     */
    public get stringQuoteStyle(): string {
        return workspace.getConfiguration(sectionKey).get<string>('resolver.stringQuoteStyle') || `'`;
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
        return workspace.getConfiguration(sectionKey).get<string[]>('resolver.ignorePatterns') || [
            'build',
            'out',
            'dist',
        ];
    }

    /**
     * A length number after which the import is transformed into a multiline import.
     * 
     * @readonly
     * @type {number}
     * @memberof VscodeResolverConfig
     */
    public get multiLineWrapThreshold(): number {
        return workspace.getConfiguration(sectionKey).get<number>('resolver.multiLineWrapThreshold') || 125;
    }

    /**
     * If a multiline named import should contain the last trailing comma.
     *
     * @readonly
     * @type {boolean}
     * @memberof VscodeResolverConfig
     *
     * @example
     * import {
     *     Foo,
     *     Bar, <<
     * } from 'whatever';
     */
    public get multiLineTrailingComma(): boolean {
        const value = workspace.getConfiguration(sectionKey).get<boolean>('resolver.multiLineTrailingComma');
        return value !== undefined ? value : true;
    }

    /**
     * Defines, if sorting is obligatory during organize imports
     * 
     * @readonly
     * @type {boolean}
     * @memberof ResolverConfig
     */
    public get disableImportSorting(): boolean {
        const value = workspace.getConfiguration(sectionKey).get<boolean>('resolver.disableImportsSorting');
        return value !== undefined ? value : false;
    }

    /**
     * Returns the tab size that is configured in vscode.
     * 
     * @readonly
     * @type {number}
     * @memberof VscodeResolverConfig
     */
    public get tabSize(): number {
        return workspace.getConfiguration().get<number>('editor.tabSize') || 4;
    }

    /**
     * Returns the configured import groups. On a parsing error, the default is used.
     * 
     * @type {ImportGroup[]}
     * @memberof VscodeResolverConfig
     */
    public get importGroups(): ImportGroup[] {
        const groups = workspace.getConfiguration(sectionKey).get<ImportGroupSetting[]>('resolver.importGroups');
        let importGroups: ImportGroup[] = [];

        try {
            if (groups) {
                importGroups = groups.map(g => ImportGroupSettingParser.parseSetting(g));
            } else {
                importGroups = ImportGroupSettingParser.default;
            }
        } catch (e) {
            importGroups = ImportGroupSettingParser.default;
        }
        if (!importGroups.some(i => i instanceof RemainImportGroup)) {
            importGroups.push(new RemainImportGroup());
        }

        return importGroups;
    }

    /**
     * All information that are needed to print an import.
     * 
     * @readonly
     * @type {TypescriptGenerationOptions}
     * @memberof VscodeResolverConfig
     */
    public get generationOptions(): TypescriptGenerationOptions {
        return {
            eol: this.insertSemicolons ? ';' : '',
            multiLineWrapThreshold: this.multiLineWrapThreshold,
            multiLineTrailingComma: this.multiLineTrailingComma,
            spaceBraces: this.insertSpaceBeforeAndAfterImportBraces,
            stringQuoteStyle: this.stringQuoteStyle,
            tabSize: this.tabSize,
        };
    }
}

/**
 * Configuration interface for the code outline feature.
 * 
 * @class VscodeCodeOutlineConfig
 * @implements {CodeOutlineConfig}
 */
class VscodeCodeOutlineConfig implements CodeOutlineConfig {

    /**
     * Defined if the code outline feature is enabled or not.
     * 
     * @readonly
     * @type {boolean}
     * @memberof VscodeCodeOutlineConfig
     */
    public get outlineEnabled(): boolean {
        const value = workspace.getConfiguration(sectionKey).get<boolean>('codeOutline.enabled');
        return value !== undefined ? value : true;
    }
}
