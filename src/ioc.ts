import 'reflect-metadata';

import { Container, interfaces } from 'inversify';
import { ExtensionContext } from 'vscode';

import Activatable from './activatable';
import CodeOutline from './code-outline';
import Configuration from './configuration';
import iocSymbols from './ioc-symbols';
import TypescriptHero from './typescript-hero';
import winstonLogger, { Logger } from './utilities/Logger';

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
    // const config = context.container.get<ConfigFactory>(iocSymbols.configuration)();
    return winstonLogger('debug', extContext);
  })
  .inSingletonScope();

export default ioc;
