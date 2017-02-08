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
     * @memberOf Resource
     */
    imports: Import[];

    /**
     * List of exports contained in this resource.
     * 
     * @type {Export[]}
     * @memberOf Resource
     */
    exports: Export[];

    // declarations: TsDeclaration[];
    // resources: TsResource[];
    // usages: string[];

    /**
     * "Unique" identifier for this resource. Can be the filepath for files or
     * node identifiers for node modules.
     * 
     * @type {string}
     * @memberOf Resource
     */
    readonly identifier: string;
}
