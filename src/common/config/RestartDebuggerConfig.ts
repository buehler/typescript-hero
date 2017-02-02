/**
 * Configuration interface for the restart debugger extension.
 * 
 * @interface RestartDebuggerConfig
 */
export interface RestartDebuggerConfig {
    /**
     * Defines the folder pathes, which are watched for changes.
     * 
     * @readonly
     * @type {string[]}
     * @memberOf RestartDebuggerConfig
     */
    watchFolders: string[];

    /**
     * Returns the active state that is configured.
     * When true, the restarter is started on startup, otherwise it's deactivated by default.
     * 
     * @readonly
     * @type {boolean}
     * @memberOf RestartDebuggerConfig
     */
    active: boolean;
}
