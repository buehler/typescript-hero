import { ExtensionConfig } from '../common/config';
import { TypescriptParser } from '../common/ts-parsing';
import { Logger } from '../common/utilities';
import { CalculatedDeclarationIndex } from './declarations/CalculatedDeclarationIndex';
import { BaseExtension } from './extensions/BaseExtension';
import { CodeActionExtension } from './extensions/CodeActionExtension';
import { CodeCompletionExtension } from './extensions/CodeCompletionExtension';
import { ImportResolveExtension } from './extensions/ImportResolveExtension';
import { iocSymbols } from './IoCSymbols';
import { TypeScriptHero } from './TypeScriptHero';
import { VscodeLogger } from './utilities/VscodeLogger';
import { VscodeExtensionConfig } from './VscodeExtensionConfig';
import { Container as IoCContainer, interfaces } from 'inversify';
import { ExtensionContext } from 'vscode';
import inversifyInjectDecorators from 'inversify-inject-decorators';

const container = new IoCContainer();

container.bind(TypeScriptHero).to(TypeScriptHero).inSingletonScope();
container.bind(iocSymbols.configuration).to(VscodeExtensionConfig).inSingletonScope();
container.bind(CalculatedDeclarationIndex).to(CalculatedDeclarationIndex).inSingletonScope();
container.bind(TypescriptParser).to(TypescriptParser);

// Extensions
container.bind<BaseExtension>(iocSymbols.extensions).to(ImportResolveExtension).inSingletonScope();
container.bind<BaseExtension>(iocSymbols.extensions).to(CodeCompletionExtension).inSingletonScope();
container.bind<BaseExtension>(iocSymbols.extensions).to(CodeActionExtension).inSingletonScope();

// Logging
container
    .bind<interfaces.Factory<Logger>>(iocSymbols.loggerFactory)
    .toFactory<Logger>((context: interfaces.Context) => {
        return (prefix?: string) => {
            const extContext = context.container.get<ExtensionContext>(iocSymbols.extensionContext);
            const config = context.container.get<ExtensionConfig>(iocSymbols.configuration);

            return new VscodeLogger(extContext, config, prefix);
        };
    });

/**
 * Injection container. IoC baby.
 */
export const Container = container;

/**
 * IocDecorators to lazy inject stuff into properties or something. Useful when normal injection via the
 * constructor is not possible.
 */
export const IocDecorators = inversifyInjectDecorators(container);
