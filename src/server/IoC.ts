//import { Logger } from '../common/utilities';
import { ImportResolveExtension } from './extensions/ImportResolveExtension';
import { ServerExtension } from './extensions/ServerExtension';
import { iocSymbols } from './IoCSymbols';
import { ServerConnection } from './utilities/ServerConnection';
import { Container as IoCContainer, interfaces } from 'inversify';

const container = new IoCContainer();

container.bind(ServerConnection).to(ServerConnection).inSingletonScope();

container.bind<ServerExtension>(iocSymbols.extensions).to(ImportResolveExtension).inSingletonScope();

// Logging
// container
//     .bind<interfaces.Factory<Logger>>(iocSymbols.loggerFactory)
//     .toFactory<Logger>((context: interfaces.Context) => {
//         context;
//         return (prefix?: string) => {
//             return prefix as any;
//         };
//     });

/**
 * Injection container. IoC baby.
 */
export const Container = container;

