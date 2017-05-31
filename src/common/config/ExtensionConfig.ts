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
}
