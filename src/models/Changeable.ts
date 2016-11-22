/**
 * TODO
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
        public isDeleted: boolean = false
    ) { }
}
