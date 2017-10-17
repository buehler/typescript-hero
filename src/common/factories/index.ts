import { VscodeExtensionConfig } from '../../extension/config/VscodeExtensionConfig';
import { TypescriptCodeGenerator } from 'typescript-parser';

/**
 * IOC Factory for the {TypescriptCodeGenerator}.
 */
export type TypescriptCodeGeneratorFactory = () => TypescriptCodeGenerator;

export type VscodeConfigFactory = () => VscodeExtensionConfig;
