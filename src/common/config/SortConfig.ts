/**
 * Configuration interface for the imports sorting.
 * 
 * @interface SortConfig
 */
export interface SortConfig {
    /**
     * Defines sorting type.
     * 
     * @readonly
     * @type {SortType}
     * @memberof SortConfig
     */
    type: SortType;

    /**
     * Defines sort order when type is set to semantic
     * 
     * @readonly
     * @type {ImportSemanticType[]}
     * @memberof SortConfig
     */
    semantic: ImportSemanticType[];
}

export type SortType = 'ascending' | 'descending' | 'semantic';

export type ImportSemanticType = 'plains' | 'globals' | 'locals';
