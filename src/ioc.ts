import 'reflect-metadata';

import { Container, interfaces } from 'inversify';
import { TypescriptCodeGenerator, TypescriptParser } from 'typescript-parser';
import { ExtensionContext, TextDocument, Uri } from 'vscode';

import Activatable from './activatable';
import { CodeCompletion } from './code-completion';
import CodeOutline from './code-outline';
import Configuration from './configuration';
import DeclarationManager from './declarations/declaration-manager';
import { ImportAppender, ImportOrganizer } from './imports';
import ImportManager from './imports/import-manager';
import iocSymbols, { ImportManagerProvider, TypescriptCodeGeneratorFactory } from './ioc-symbols';
import TypescriptHero from './typescript-hero';
import winstonLogger, { Logger } from './utilities/logger';
import { getScriptKind } from './utilities/utility-functions';

const ioc = new Container();

// Entry point
ioc.bind(TypescriptHero).to(TypescriptHero).inSingletonScope();

// Activatables
ioc.bind<Activatable>(iocSymbols.activatables).to(CodeOutline).inSingletonScope();
ioc.bind<Activatable>(iocSymbols.activatables).to(ImportOrganizer).inSingletonScope();
ioc.bind<Activatable>(iocSymbols.activatables).to(ImportAppender).inSingletonScope();
ioc.bind<Activatable>(iocSymbols.activatables).to(CodeCompletion).inSingletonScope();

// Configuration
ioc.bind<Configuration>(iocSymbols.configuration).to(Configuration).inSingletonScope();

// Logging
ioc
  .bind<Logger>(iocSymbols.logger)
  .toDynamicValue((context: interfaces.Context) => {
    const extContext = context.container.get<ExtensionContext>(iocSymbols.extensionContext);
    const config = context.container.get<Configuration>(iocSymbols.configuration);
    return winstonLogger(config.verbosity(), extContext);
  })
  .inSingletonScope();

// Managers
ioc.bind<ImportManagerProvider>(iocSymbols.importManager).toProvider<ImportManager>(
  context => async (document: TextDocument) => {
    const parser = context.container.get<TypescriptParser>(iocSymbols.parser);
    const config = context.container.get<Configuration>(iocSymbols.configuration);
    const logger = context.container.get<Logger>(iocSymbols.logger);
    const generatorFactory = context.container.get<TypescriptCodeGeneratorFactory>(iocSymbols.generatorFactory);
    const source = await parser.parseSource(document.getText(), getScriptKind(document.fileName));
    return new ImportManager(document, source, parser, config, logger, generatorFactory);
  },
);
ioc.bind<DeclarationManager>(iocSymbols.declarationManager).to(DeclarationManager).inSingletonScope();

// Typescript
ioc.bind<TypescriptParser>(iocSymbols.parser).toConstantValue(new TypescriptParser());
ioc
  .bind<TypescriptCodeGeneratorFactory>(iocSymbols.generatorFactory)
  .toFactory<TypescriptCodeGenerator>((context: interfaces.Context) => {
    return (resource: Uri) => {
      const config = context.container.get<Configuration>(iocSymbols.configuration);
      return new TypescriptCodeGenerator(config.typescriptGeneratorOptions(resource));
    };
  });

export default ioc;
