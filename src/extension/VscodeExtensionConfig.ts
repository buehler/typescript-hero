import { ResolverMode } from '../common/enums';
import { injectable } from 'inversify';
import { TypescriptGenerationOptions } from 'typescript-parser';
import { workspace, WorkspaceConfiguration } from 'vscode';

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

    private get workspaceSection(): WorkspaceConfiguration {
        return workspace.getConfiguration(sectionKey);
    }

    /**
     * The actual log level.
     * 
     * @readonly
     * @type {string}
     * @memberof VscodeExtensionConfig
     */
    public get verbosity(): string {
        return this.workspaceSection.get<string>('verbosity') || 'Warning';
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

    /**
     * Completion sort mode
     *
     * @readonly
     * @type {'default'|'bottom'}
     * @memberof VscodeExtensionConfig
     */
    public get completionSortMode(): 'default' | 'bottom' {
        return this.workspaceSection.get<'default' | 'bottom'>('completionSortMode') || 'default';
    }
}

/**
 * Configuration class for the resolver extension.
 * 
 * @class VscodeResolverConfig
 */
class VscodeResolverConfig implements ResolverConfig {
    private get workspaceSection(): WorkspaceConfiguration {
        return workspace.getConfiguration(sectionKey);
    }

    /**
     * Defines, if there should be a space between the brace and the import specifiers.
     * {Symbol} vs { Symbol }
     * 
     * @readonly
     * @type {boolean}
     * @memberof VscodeResolverConfig
     */
    public get insertSpaceBeforeAndAfterImportBraces(): boolean {
        const value = this.workspaceSection.get<boolean>('resolver.insertSpaceBeforeAndAfterImportBraces');
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
        const value = this.workspaceSection.get<boolean>('resolver.insertSemicolons');
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
        return this.workspaceSection.get<string>('resolver.stringQuoteStyle') || `'`;
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
        return this.workspaceSection.get<string[]>('resolver.ignorePatterns') || [
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
        return this.workspaceSection.get<number>('resolver.multiLineWrapThreshold') || 125;
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
        const value = this.workspaceSection.get<boolean>('resolver.multiLineTrailingComma');
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
        const value = this.workspaceSection.get<boolean>('resolver.disableImportsSorting');
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
     * Returns the list of imports that should be ignored during organize import feature.
     * 
     * @readonly
     * @type {string[]}
     * @memberof VscodeResolverConfig
     */
    public get ignoreImportsForOrganize(): string[] {
        return this.workspaceSection.get<string[]>('resolver.ignoreImportsForOrganize') || [];
    }

    /**
     * Returns the configured import groups. On a parsing error, the default is used.
     * 
     * @type {ImportGroup[]}
     * @memberof VscodeResolverConfig
     */
    public get importGroups(): ImportGroup[] {
        const groups = this.workspaceSection.get<ImportGroupSetting[]>('resolver.importGroups');
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

    /**
     * Current mode of the resolver.
     * 
     * @readonly
     * @type {ResolverMode}
     * @memberof VscodeResolverConfig
     */
    public get resolverMode(): ResolverMode {
        const mode = this.workspaceSection.get<string>('resolver.resolverMode', 'TypeScript');
        return ResolverMode[mode] || ResolverMode.TypeScript;
    }

    /**
     * Returns a list of file globs for the actual set resolver mode.
     *
     * @example `TypeScript`
     * Will return: ['\*\*\/\*.ts', '\*\*\/\*.tsx']
     *
     * @example `ES6`
     * Will return: ['\*\*\/\*.js', '\*\*\/\*.jsx']
     * 
     * @type {string[]}
     * @memberof VscodeResolverConfig
     */
    public get resolverModeFileGlobs(): string[] {
        const mode = this.resolverMode;
        const globs: string[] = [];

        if (mode === ResolverMode.TypeScript || mode === ResolverMode.Both) {
            globs.push('**/*.ts');
            globs.push('**/*.tsx');
        }

        if (mode === ResolverMode.ES6 || mode === ResolverMode.Both) {
            globs.push('**/*.js');
            globs.push('**/*.jsx');
        }

        return globs;
    }

    /**
     * Returns a list of usable languages for the set resolver mode.
     *
     * @example `TypeScript`
     * Will return: ['typescript', 'typescriptreact']
     * 
     * @readonly
     * @type {string[]}
     * @memberof VscodeResolverConfig
     */
    public get resolverModeLanguages(): string[] {
        const mode = this.resolverMode;
        const languages: string[] = [];

        if (mode === ResolverMode.TypeScript || mode === ResolverMode.Both) {
            languages.push('typescript');
            languages.push('typescriptreact');
        }

        if (mode === ResolverMode.ES6 || mode === ResolverMode.Both) {
            languages.push('javascript');
            languages.push('javascriptreact');
        }

        return languages;
    }

    /**
     * Defines if typescript hero tries to organize your imports of a
     * file as soon as the file would be saved.
     * 
     * @readonly
     * @type {boolean}
     * @memberof VscodeResolverConfig
     */
    public get organizeOnSave(): boolean {
        const value = this.workspaceSection.get<boolean>('resolver.organizeOnSave');
        return value !== undefined ? value : false;
    }
}

/**
 * Configuration interface for the code outline feature.
 * 
 * @class VscodeCodeOutlineConfig
 * @implements {CodeOutlineConfig}
 */
class VscodeCodeOutlineConfig implements CodeOutlineConfig {
    private get workspaceSection(): WorkspaceConfiguration {
        return workspace.getConfiguration(sectionKey);
    }

    /**
     * Defined if the code outline feature is enabled or not.
     * 
     * @readonly
     * @type {boolean}
     * @memberof VscodeCodeOutlineConfig
     */
    public get outlineEnabled(): boolean {
        const value = this.workspaceSection.get<boolean>('codeOutline.enabled');
        return value !== undefined ? value : true;
    }
}
