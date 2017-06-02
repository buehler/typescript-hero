import { ImportGroup } from '../../extension/import-grouping';
import { GenerationOptions, ImportLocation } from '../ts-generation';

/**
 * Configuration interface for the resolver extension.
 * 
 * @interface ResolverConfig
 */
export interface ResolverConfig {
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
     * Array of string that are excluded from indexing (e.g. build, out, node_modules).
     * If those parts are found after the workspace path is striped away, the file is ignored.
     * 
     * @readonly
     * @type {string[]}
     * @memberof ResolverConfig
     */
    ignorePatterns: string[];

    /**
     * A length number after which the import is transformed into a multiline import.
     * 
     * @readonly
     * @type {number}
     * @memberof ResolverConfig
     */
    multiLineWrapThreshold: number;

    /**
     * Where the new imports should be added (e.g. top of the file, current cursor location, etc).
     * 
     * @readonly
     * @type {ImportLocation}
     * @memberof ResolverConfig
     */
    newImportLocation: ImportLocation;

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
     * @type {GenerationOptions}
     * @memberof ResolverConfig
     */
    generationOptions: GenerationOptions;
}
