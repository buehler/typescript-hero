import { Generatable } from '../../common/ts-generation';
import { Import } from '../../common/ts-parsing/imports';
import { ImportGroupOrder } from './ImportGroupOrder';

/**
 * Interface for an import group. A group contains a list of imports that are grouped and sorted
 * together on organizing all imports and inserting new imports.
 * 
 * @export
 * @interface ImportGroup
 * @extends {Generatable}
 */
export interface ImportGroup extends Generatable {
    /**
     * The readonly list of imports for this group.
     * 
     * @type {Import[]}
     * @memberof ImportGroup
     */
    readonly imports: Import[];

    /**
     * A sorted list of the imports of this group.
     * 
     * @type {Import[]}
     * @memberof ImportGroup
     */
    readonly sortedImports: Import[];
    
    /**
     * The order of the imports (asc / desc).
     * 
     * @type {ImportGroupOrder}
     * @memberof ImportGroup
     */
    order: ImportGroupOrder;
    
    /**
     * Adds the given import to itself if it is the correct group for the import. Does return true if the import is
     * handled, otherwise it must return false.
     * 
     * @param {Import} tsImport 
     * @returns {boolean} 
     * 
     * @memberof ImportGroup
     */
    processImport(tsImport: Import): boolean;
    
    /**
     * Resets the import group (clears the imports).
     * 
     * 
     * @memberof ImportGroup
     */
    reset(): void;
}
