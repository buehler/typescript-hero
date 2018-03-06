import { TypescriptCodeGenerator } from 'typescript-parser';
import { TextDocument, Uri } from 'vscode';

import ImportManager from './imports/import-manager';

export default {
  activatables: Symbol('activatables'),
  configuration: Symbol('configuration'),
  declarationManager: Symbol('declarationManager'),
  extensionContext: Symbol('extensionContext'),
  generatorFactory: Symbol('generatorFactory'),
  importManager: Symbol('importManager'),
  logger: Symbol('logger'),
  parser: Symbol('parser'),
};

export type ImportManagerProvider = (document: TextDocument) => Promise<ImportManager>;
export type TypescriptCodeGeneratorFactory = (resource: Uri) => TypescriptCodeGenerator;
