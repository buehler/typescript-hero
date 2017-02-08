/**
 * Error that should be thrown, when a feature is not implemented yet.
 * 
 * @export
 * @class NotImplementedYetError
 * @extends {Error}
 */
export class NotImplementedYetError extends Error {
    constructor() {
        super();
        this.message = 'This feature is not yet implemented.';
    }
}
