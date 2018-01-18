/**
 * Class that represents an object (virtual object) that can be modified.
 * Is used for ClassManager and other ObjectManager classes to keep track on modified objects.
 * 
 * @export
 * @class Changeable
 * @template T
 */
export class Changeable<T> {
    constructor(
        public object: T,
        public isNew: boolean = false,
        public isModified: boolean = false,
        public isDeleted: boolean = false,
    ) { }
}
