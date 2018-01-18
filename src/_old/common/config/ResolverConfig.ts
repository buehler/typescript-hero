import { TypescriptGenerationOptions } from 'typescript-parser';
import { Uri } from 'vscode';

import { ImportGroup } from '../../extension/import-grouping';
import { ResolverMode } from '../enums';

/**
 * Configuration interface for the resolver extension.
 *
 * @interface ResolverConfig
 */
export interface ResolverConfig {
    /**
     * The given resource URI (if any) for the actual configuration.
     * Is needed to determine the actual config values for multi root environments.
     *
     * @readonly
     * @type {Uri}
     * @memberof ResolverConfig
     */
    resource?: Uri;

    /**
     * Defines, if there should be a space between the brace and the import specifiers.
     * {Symbol} vs { Symbol }
     *
     * @readonly
     * @type {boolean}
     * @memberof ResolverConfig
     */
    insertSpaceBeforeAndAfterImportBraces: boolean;

    /**
     * Defines, if there should be a semicolon at the end of a statement.
     * import Symbol from 'symbol' vs import Symbol from 'symbol';
     *
     * @readonly
     * @type {boolean}
     * @memberof ResolverConfig
     */
    insertSemicolons: boolean;

    /**
     * Defines the quote style (' or ").
     *
     * @readonly
     * @type {string}
     * @memberof ResolverConfig
     */
    stringQuoteStyle: string;

    /**
     * Array of string that are excluded from indexing of the workspace (e.g. build, out, dist).
     * This patterns are ignored during indexing of the files found in the workspace.
     * To exclude other files that are found in the node_modules, use moduleIgnorePatterns.
     *
     * @readonly
     * @type {string[]}
     * @memberof ResolverConfig
     */
    workspaceIgnorePatterns: string[];

    /**
     * Array of string that are excluded from indexing of the modules (e.g. further node_modules).
     * This patterns are ignored during indexing of the files found in the workspace.
     * To exclude other files that are found in the node_modules, use moduleIgnorePatterns.
     *
     * @readonly
     * @type {string[]}
     * @memberof ResolverConfig
     */
    moduleIgnorePatterns: string[];

    /**
     * A length number after which the import is transformed into a multiline import.
     *
     * @readonly
     * @type {number}
     * @memberof ResolverConfig
     */
    multiLineWrapThreshold: number;

    /**
     * If a multiline named import should contain the last trailing comma.
     *
     * @readonly
     * @type {boolean}
     * @memberof ResolverConfig
     *
     * @example
     * import {
     *     Foo,
     *     Bar, <<
     * } from 'whatever';
     */
    multiLineTrailingComma: boolean;

    /**
     * Returns the tab size that is configured in vscode.
     *
     * @readonly
     * @type {number}
     * @memberof ResolverConfig
     */
    tabSize: number;

    /**
     * Disables sorting of the imports on organize.
     *
     * @type {boolean}
     * @memberof ResolverConfig
     */
    disableImportSorting: boolean;

    /**
     * Disables removal of the unsed imports on organize.
     *
     * @type {boolean}
     * @memberof ResolverConfig
     */
    disableImportRemovalOnOrganize: boolean;

    /**
     * List of import libraries ("from" part) which are ignored during the organize import function.
     *
     * @type {string[]}
     * @memberof ResolverConfig
     */
    ignoreImportsForOrganize: string[];

    /**
     * Returns the configured import groups. On a parsing error, a default should be provided.
     *
     * @type {ImportGroup[]}
     * @memberof ResolverConfig
     */
    importGroups: ImportGroup[];

    /**
     * All information that are needed to print an import.
     *
     * @readonly
     * @type {TypescriptGenerationOptions}
     * @memberof ResolverConfig
     */
    generationOptions: TypescriptGenerationOptions;

    /**
     * Current mode of the resolver.
     *
     * @type {ResolverMode}
     * @memberof ResolverConfig
     */
    resolverMode: ResolverMode;

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
     * @memberof ResolverConfig
     */
    resolverModeFileGlobs: string[];

    /**
     * Returns a list of usable languages for the set resolver mode.
     *
     * @example `TypeScript`
     * Will return: ['typescript', 'typescriptreact']
     *
     * @type {string[]}
     * @memberof ResolverConfig
     */
    resolverModeLanguages: string[];

    /**
     * Sorts imports by first specifier / alias / default alias (when available),
     * instead of by library names (module paths).
     *
     * @type {boolean}
     * @memberof ResolverConfig
     */
    organizeSortsByFirstSpecifier: boolean;

    /**
     * Defines if typescript hero tries to organize your imports of a
     * file as soon as the file would be saved.
     *
     * @type {boolean}
     * @memberof ResolverConfig
     */
    organizeOnSave: boolean;

    /**
     * Defines if typescript hero should ask the user for default specifiers or duplicate specifier aliases.
     * If true, tsh does ask the user.
     *
     * @type {boolean}
     * @memberof ResolverConfig
     */
    promptForSpecifiers: boolean;
}
