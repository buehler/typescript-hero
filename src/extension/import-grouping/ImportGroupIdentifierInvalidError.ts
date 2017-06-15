/**
 * Thrown when a import group identifier neither does match a keyword nor a regex pattern.
 * 
 * @export
 * @class ImportGroupIdentifierInvalidError
 * @extends {Error}
 */
export class ImportGroupIdentifierInvalidError extends Error {
    constructor(identifier: string) {
        super();
        this.message = `The identifier "${identifier}" does not match a keyword or a regex pattern (/ .. /).`;
    }
}
