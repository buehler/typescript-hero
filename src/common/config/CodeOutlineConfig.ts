import { Uri } from 'vscode';

/**
 * Configuration interface for the code outline feature.
 *
 * @export
 * @interface CodeOutlineConfig
 */
export interface CodeOutlineConfig {
    /**
     * The given resource URI (if any) for the actual configuration.
     * Is needed to determine the actual config values for multi root environments.
     *
     * @readonly
     * @type {(Uri | undefined)}
     * @memberof CodeOutlineConfig
     */
    resource: Uri | undefined;

    /**
     * Defined if the code outline feature is enabled or not.
     *
     * @type {boolean}
     * @memberof CodeOutlineConfig
     */
    outlineEnabled: boolean;
}
