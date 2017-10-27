/**
 * List of usable symbols for IoC.
 */
export const iocSymbols = {
    configuration: Symbol('config'),
    extensionContext: Symbol('context'),
    extensions: Symbol('extensions'),
    loggerFactory: Symbol('loggerFactory'),
    logger: Symbol('logger'),
    generatorFactory: Symbol('generatorFactory'),
    codeActionCreators: Symbol('codeActionCreators'),
    declarationIndexMapper: Symbol('declarationIndexMapper'),
    typescriptParser: Symbol('typescriptParser'),
};
