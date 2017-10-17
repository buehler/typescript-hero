import { Uri } from 'vscode';

/**
 * Configuration interface for the code outline feature.
 *
 * @export
 * @interface CodeCompletionConfig
 */
export interface CodeCompletionConfig {
    /**
     * The given resource URI (if any) for the actual configuration.
     * Is needed to determine the actual config values for multi root environments.
     *
     * @readonly
     * @type {Uri}
     * @memberof CodeCompletionConfig
     */
    resource?: Uri;

    /**
     * Defines the used completion sort mode (i.e. if the completions should be sorted to the bottom of the list).
     *
     * @type {('default' | 'bottom')}
     * @memberof CodeCompletionConfig
     */
    completionSortMode: 'default' | 'bottom';
}
