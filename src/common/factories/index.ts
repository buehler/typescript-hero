import { TypescriptCodeGenerator } from 'typescript-parser';

/**
 * IOC Factory for the {TypescriptCodeGenerator}.
 */
export type TypescriptCodeGeneratorFactory = () => TypescriptCodeGenerator;
