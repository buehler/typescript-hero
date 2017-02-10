import { DeclarationIndex } from './indices/DeclarationIndex';
import { TypescriptParser } from '../common/ts-parsing/TypescriptParser';
import { ServerLogger } from './utilities/ServerLogger';
import { Logger } from '../common/utilities';
import { ImportResolveExtension } from './extensions/ImportResolveExtension';
import { ServerExtension } from './extensions/ServerExtension';
import { iocSymbols } from './IoCSymbols';
import { ServerConnection } from './utilities/ServerConnection';
import { Container as IoCContainer, interfaces } from 'inversify';

const container = new IoCContainer();

container.bind(ServerConnection).to(ServerConnection).inSingletonScope();
container.bind(DeclarationIndex).to(DeclarationIndex).inSingletonScope();
container.bind(TypescriptParser).to(TypescriptParser);

container.bind<ServerExtension>(iocSymbols.extensions).to(ImportResolveExtension).inSingletonScope();

// Logging
container
    .bind<interfaces.Factory<Logger>>(iocSymbols.loggerFactory)
    .toFactory<Logger>((context: interfaces.Context) => {
        const connection = context.container.get(ServerConnection);
        return (prefix?: string) => {
            return new ServerLogger(connection, prefix);
        };
    });

/**
 * Injection container. IoC baby.
 */
export const Container = container;
