/**
 * Import options type. Contains all information needed to stringify an import.
 * 
 * @export
 * @typedef TsImportOptions
 * 
 * @property {string} pathDelimiter - Which quote type should be used (' or ").
 * @property {boolean} spaceBraces - Defines if the symbols should have spacing in the braces ({ Foo } or {Foo}).
 * @property {number} multiLineWrapThreshold - The threshold where an import is written as multiline.
 * @property {number} tabSize - How many spaces of indentiation.
 */
export type TsImportOptions = {
    pathDelimiter: string,
    spaceBraces: boolean,
    multiLineWrapThreshold: number,
    tabSize: number
};

/**
 * Where a new import should be located.
 * 
 * @export
 * @enum {number}
 */
export enum ImportLocation {
    TopOfFile,
    AtCursorLocation
}

// TODO rename.
