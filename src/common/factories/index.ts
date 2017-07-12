import { TypescriptCodeGenerator, TypescriptParser, DeclarationIndex } from 'typescript-parser';

/**
 * IOC Factory for the {TypescriptCodeGenerator}.
 */
export type TypescriptCodeGeneratorFactory = () => TypescriptCodeGenerator;

/**
 * IOC Factory for the {TypescriptParser}.
 */
export type TypescriptParserFactory = () => TypescriptParser;

/**
 * IOC Factory for the {DeclarationIndex}.
 */
export type DeclarationIndexFactory = () => DeclarationIndex;
