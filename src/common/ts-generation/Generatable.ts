import { GenerationOptions } from './GenerationOptions';

/**
 * Interface for generatable objects. Those objects can be "stringified" to typescript code.
 * 
 * @export
 * @interface Generatable
 */
export interface Generatable {
    /**
     * Generates typescript code out of the actual object. Must respect the given options.
     * 
     * @param {GenerationOptions} options
     * @returns {string}
     * 
     * @memberOf Generatable
     */
    generateTypescript(options: GenerationOptions): string;
}
