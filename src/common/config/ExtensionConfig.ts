import { ResolverConfig } from './ResolverConfig';
import { RestartDebuggerConfig } from './RestartDebuggerConfig';

/**
 * Configuration interface for TypeScript Hero
 * Contains all exposed config endpoints.
 * 
 * @export
 * @interface ExtensionConfig
 */
export interface ExtensionConfig {
    /**
     * The actual log level.
     * 
     * @readonly
     * @type {string}
     * @memberOf ExtensionConfig
     */
    verbosity: string;

    /**
     * Configuration object for the resolver extension.
     * 
     * @readonly
     * @type {ResolverConfig}
     * @memberOf ExtensionConfig
     */
    resolver: ResolverConfig;

    /**
     * Configuration object for the restart debugger extension.
     * 
     * @readonly
     * @type {RestartDebuggerConfig}
     * @memberOf ExtensionConfig
     */
    restartDebugger: RestartDebuggerConfig;
}
