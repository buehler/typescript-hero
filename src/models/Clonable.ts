/**
 * Interface for clonable objects. The clone() method creates a deep clone of the object.
 * 
 * @export
 * @interface Clonable
 */
export interface Clonable {
    /**
     * Create a deep clone of this object.
     * 
     * @template T
     * @returns {T}
     * 
     * @memberOf Clonable
     */
    clone<T>(): T;
}
