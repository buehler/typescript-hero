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

/**
 * TODO
 * 
 * @export
 * @class MethodDuplicated
 * @extends {Error}
 */
export class MethodDuplicated extends Error {
    constructor(methodName: string, parent: string) {
        super();
        this.message = `The method "${methodName}" is duplicated in "${parent}".`;
    }
}

/**
 * TODO
 * 
 * @export
 * @class MethodNotFound
 * @extends {Error}
 */
export class MethodNotFound extends Error {
    constructor(methodName: string, parent?: string) {
        super();
        this.message = `The method "${methodName}" was not found${parent ? ` in "${parent}"` : ''}.`;
    }
}
