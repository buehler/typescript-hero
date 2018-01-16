import 'reflect-metadata';

import { Container, interfaces } from 'inversify';
import { TypescriptCodeGenerator, TypescriptParser } from 'typescript-parser';
import { ExtensionContext, TextDocument, Uri } from 'vscode';

import Activatable from './activatable';
import CodeOutline from './code-outline';
import Configuration from './configuration';
import ImportManager from './import-organizer/ImportManager';
import iocSymbols, { ImportManagerProvider } from './ioc-symbols';
import TypescriptHero from './typescript-hero';
import winstonLogger, { Logger } from './utilities/Logger';
import { getScriptKind } from './utilities/utilityFunctions';

const ioc = new Container();

// Entry point
ioc.bind(TypescriptHero).to(TypescriptHero).inSingletonScope();

// Activatables
ioc.bind<Activatable>(iocSymbols.activatables).to(CodeOutline).inSingletonScope();

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
    const source = await parser.parseSource(document.getText(), getScriptKind(document.fileName));
    return new ImportManager(document, source);
  },
);

// Typescript
ioc.bind<TypescriptParser>(iocSymbols.parser).toConstantValue(new TypescriptParser());
ioc
  .bind<interfaces.Factory<TypescriptCodeGenerator>>(iocSymbols.generatorFactory)
  .toFactory<TypescriptCodeGenerator>((context: interfaces.Context) => {
    return (resource: Uri) => {
      const config = context.container.get<Configuration>(iocSymbols.configuration);
      return new TypescriptCodeGenerator(config.typescriptGeneratorOptions(resource));
    };
  });

export default ioc;
