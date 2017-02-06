/**
 * Typescript generation options type. Contains all information needed to stringify some objects to typescript.
 * 
 * @export
 * @typedef GenerationOptions
 * 
 * @property {string} stringQuoteStyle Which quote type should be used (' or ").
 * @property {string} eol Defines end of line character (semicolon or nothing) 
 * @property {boolean} spaceBraces Defines if the symbols should have spacing in the braces ({ Foo } or {Foo}).
 * @property {number} multiLineWrapThreshold The threshold where an import is written as multiline.
 * @property {number} tabSize How many spaces of indentiation.
 */
export type GenerationOptions = {
    stringQuoteStyle: string,
    eol: '' | ';',
    spaceBraces: boolean,
    multiLineWrapThreshold: number,
    tabSize: number
};
