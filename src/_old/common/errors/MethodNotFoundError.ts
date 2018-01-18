/**
 * Thrown when a method should be removed that does not exist on the virtual class.
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
