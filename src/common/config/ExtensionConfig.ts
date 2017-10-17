import { Uri } from 'vscode';

import { CodeOutlineConfig } from './CodeOutlineConfig';
import { ResolverConfig } from './ResolverConfig';

/**
 * Configuration interface for TypeScript Hero
 * Contains all exposed config endpoints.
 *
 * @export
 * @interface ExtensionConfig
 */
export interface ExtensionConfig {
    /**
     * The given resource URI (if any) for the actual configuration.
     * Is needed to determine the actual config values for multi root environments.
     *
     * @readonly
     * @type {(Uri | undefined)}
     * @memberof ExtensionConfig
     */
    resource: Uri | undefined;

    /**
     * The actual log level.
     *
     * @readonly
     * @type {string}
     * @memberof ExtensionConfig
     */
    verbosity: string;

    /**
     * Configuration object for the resolver extension.
     *
     * @readonly
     * @type {ResolverConfig}
     * @memberof ExtensionConfig
     */
    resolver: ResolverConfig;

    /**
    * Configuration object for the code outline extension.
    *
    * @readonly
    * @type {CodeOutlineConfig}
    * @memberof ExtensionConfig
    */
    codeOutline: CodeOutlineConfig;

    /**
     * Completion sorting mode:
     *  default: Use default VSCode sorting mode
     *  bottom: Push to bottom
     *
     * @readonly
     * @type {'default'|'bottom'}
     * @memberof ExtensionConfig
     */
    completionSortMode: 'default' | 'bottom';
}
