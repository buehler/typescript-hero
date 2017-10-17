import { TypescriptCodeGenerator } from 'typescript-parser';
import { Uri } from 'vscode';

import { VscodeExtensionConfig } from '../../extension/config/VscodeExtensionConfig';

/**
 * IOC Factory for the {TypescriptCodeGenerator}.
 */
export type TypescriptCodeGeneratorFactory = () => TypescriptCodeGenerator;

export type VscodeConfigFactory = (resource?: Uri) => VscodeExtensionConfig;
