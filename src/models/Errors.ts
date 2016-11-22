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

/**
 * TODO
 * 
 * @export
 * @class PropertyDuplicated
 * @extends {Error}
 */
export class PropertyDuplicated extends Error {
    constructor(propName: string, parent: string) {
        super();
        this.message = `The property "${propName}" is duplicated in "${parent}".`;
    }
}

/**
 * TODO
 * 
 * @export
 * @class PropertyNotFound
 * @extends {Error}
 */
export class PropertyNotFound extends Error {
    constructor(propName: string, parent?: string) {
        super();
        this.message = `The property "${propName}" was not found${parent ? ` in "${parent}"` : ''}.`;
    }
}
