/**
 * This error is thrown, when a class manager does not find the searched class in the given document.
 * 
 * @export
 * @class ClassNotFoundError
 * @extends {Error}
 */
export class ClassNotFoundError extends Error {
    constructor(className: string) {
        super();
        this.message = `The class "${className}" was not found in the given document.`;
    }
}
