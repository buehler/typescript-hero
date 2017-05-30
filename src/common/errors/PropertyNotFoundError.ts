/**
 * Thrown when a property does not exist on a virtual class.
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
