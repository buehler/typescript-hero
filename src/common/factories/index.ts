import { TypescriptCodeGenerator } from 'typescript-parser';
import { Uri } from 'vscode';

import { ExtensionConfig } from '../config';

/**
 * IOC Factory for the {TypescriptCodeGenerator}.
 */
export type TypescriptCodeGeneratorFactory = () => TypescriptCodeGenerator;

export type ConfigFactory = (resource: Uri | null) => ExtensionConfig;
