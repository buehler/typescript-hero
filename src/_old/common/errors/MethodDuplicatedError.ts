/**
 * Thrown when a method should be added to a virtual class that is already present.
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
