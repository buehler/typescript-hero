import { TypescriptGenerationOptions } from 'typescript-parser';
import { Uri, workspace, WorkspaceConfiguration } from 'vscode';

import { ResolverConfig } from '../../common/config';
import { ResolverMode } from '../../common/enums';
import { ImportGroup, ImportGroupSetting, ImportGroupSettingParser, RemainImportGroup } from '../import-grouping';

const sectionKey = 'typescriptHero.resolver';

/**
 * Configuration class for the resolver extension.
 *
 * @class VscodeResolverConfig
 */
export class VscodeResolverConfig implements ResolverConfig {
    private get workspaceSection(): WorkspaceConfiguration {
        return workspace.getConfiguration(sectionKey, this.resource);
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
        return this.workspaceSection.get('insertSpaceBeforeAndAfterImportBraces', true);
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
        return this.workspaceSection.get('insertSemicolons', true);
    }

    /**
     * Defines the quote style (' or ").
     *
     * @readonly
     * @type {string}
     * @memberof VscodeResolverConfig
     */
    public get stringQuoteStyle(): string {
        return this.workspaceSection.get('stringQuoteStyle', `'`);
    }

    /**
     * Array of string that are excluded from indexing of the workspace (e.g. build, out, dist).
     * This patterns are ignored during indexing of the files found in the workspace.
     * To exclude other files that are found in the node_modules, use moduleIgnorePatterns.
     *
     * @readonly
     * @type {string[]}
     * @memberof VscodeResolverConfig
     */
    public get workspaceIgnorePatterns(): string[] {
        return this.workspaceSection.get(
            'workspaceIgnorePatterns',
            [
                '**/build/**/*',
                '**/out/**/*',
                '**/dist/**/*',
            ],
        );
    }

    /**
     * Array of string that are excluded from indexing of the modules (e.g. further node_modules).
     * This patterns are ignored during indexing of the files found in the workspace.
     * To exclude other files that are found in the node_modules, use moduleIgnorePatterns.
     *
     * @readonly
     * @type {string[]}
     * @memberof VscodeResolverConfig
     */
    public get moduleIgnorePatterns(): string[] {
        return this.workspaceSection.get(
            'moduleIgnorePatterns',
            [
                '**/node_modules/**/*',
            ],
        );
    }

    /**
     * A length number after which the import is transformed into a multiline import.
     *
     * @readonly
     * @type {number}
     * @memberof VscodeResolverConfig
     */
    public get multiLineWrapThreshold(): number {
        return this.workspaceSection.get('multiLineWrapThreshold', 125);
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
        return this.workspaceSection.get('multiLineTrailingComma', true);
    }

    /**
     * Defines, if sorting is obligatory during organize imports
     *
     * @readonly
     * @type {boolean}
     * @memberof ResolverConfig
     */
    public get disableImportSorting(): boolean {
        return this.workspaceSection.get('disableImportsSorting', false);
    }

    /**
     * Defines, if removal unsed is obligatory during organize imports
     *
     * @readonly
     * @type {boolean}
     * @memberof ResolverConfig
     */
    public get disableImportRemovalOnOrganize(): boolean {
        return this.workspaceSection.get('disableImportRemovalOnOrganize', false);
    }

    /**
     * Returns the tab size that is configured in vscode.
     *
     * @readonly
     * @type {number}
     * @memberof VscodeResolverConfig
     */
    public get tabSize(): number {
        return workspace.getConfiguration().get('editor.tabSize', 4);
    }

    /**
     * Returns the list of imports that should be ignored during organize import feature.
     *
     * @readonly
     * @type {string[]}
     * @memberof VscodeResolverConfig
     */
    public get ignoreImportsForOrganize(): string[] {
        return this.workspaceSection.get('ignoreImportsForOrganize', []);
    }

    /**
     * Returns the configured import groups. On a parsing error, the default is used.
     *
     * @type {ImportGroup[]}
     * @memberof VscodeResolverConfig
     */
    public get importGroups(): ImportGroup[] {
        const groups = this.workspaceSection.get<ImportGroupSetting[]>('importGroups');
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
     * Current mode of the
     *
     * @readonly
     * @type {ResolverMode}
     * @memberof VscodeResolverConfig
     */
    public get resolverMode(): ResolverMode {
        const mode = this.workspaceSection.get('resolverMode', 'TypeScript');
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
     * Is a combination between the editor.formatOnSave and the resolver settings.
     *
     * @readonly
     * @type {boolean}
     * @memberof VscodeResolverConfig
     */
    public get organizeOnSave(): boolean {
        const typescriptHeroValue = this.workspaceSection.get('organizeOnSave', false);
        const editorValue = workspace.getConfiguration('editor', this.resource).get('formatOnSave', false);
        return typescriptHeroValue && editorValue;
    }

    /**
     * Defines if typescript hero import organization (sorting) uses first
     * available specifier/alias, when available, instead of library names
     * (module paths).
     *
     * @readonly
     * @type {boolean}
     * @memberof VscodeResolverConfig
     */
    public get organizeSortsByFirstSpecifier(): boolean {
        return this.workspaceSection.get('organizeSortsByFirstSpecifier', false);
    }

    /**
     * Defines if typescript hero should ask the user for default specifiers or duplicate specifier aliases.
     * If true, tsh does ask the user.
     *
     * @readonly
     * @type {boolean}
     * @memberof VscodeResolverConfig
     */
    public get promptForSpecifiers(): boolean {
        return this.workspaceSection.get('promptForSpecifiers', false);
    }

    constructor(public readonly resource?: Uri) { }
}
