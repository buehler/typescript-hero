import { Declaration } from '../declarations';
import { Export } from '../exports';
import { Import } from '../imports';

/**
 * Base interface for resources. All resources share the same properties.
 * Resources are files, namespaces or modules.
 * 
 * @export
 * @interface Resource
 */
export interface Resource {
    /**
     * List of imports contained in this resource.
     * 
     * @type {Import[]}
     * @memberof Resource
     */
    imports: Import[];

    /**
     * List of exports contained in this resource.
     * 
     * @type {Export[]}
     * @memberof Resource
     */
    exports: Export[];

    /**
     * List of declarations that are contained in this resource.
     * 
     * @type {Declaration[]}
     * @memberof Resource
     */
    declarations: Declaration[];

    /**
     * List of subresources (like namespaces in a file) of this resource.
     * 
     * @type {Resource[]}
     * @memberof Resource
     */
    resources: Resource[];
    
    /**
     * List of used identifiers in this resource.
     * (i.e. actual used string identifiers to calculate missing imports and stuff.)
     * 
     * @type {string[]}
     * @memberof Resource
     */
    usages: string[];

    /**
     * "Unique" identifier for this resource. Can be the filepath for files or
     * node identifiers for node modules.
     * 
     * @type {string}
     * @memberof Resource
     */
    readonly identifier: string;

    /**
     * Returns an array of usages (a usage is a used symbol name in the resource)
     * that are not covered by its own declarations. 
     * 
     * @type {string[]}
     * @memberof Resource
     */
    readonly nonLocalUsages: string[];
}
