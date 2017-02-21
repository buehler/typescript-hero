import { ExtensionConfig } from '../common/config';
import { TypescriptParser } from '../common/ts-parsing';
import { Logger } from '../common/utilities';
import { BaseExtension } from './extensions/BaseExtension';
import { ImportResolveExtension } from './extensions/ImportResolveExtension';
import { iocSymbols } from './IoCSymbols';
import { TypeScriptHero } from './TypeScriptHero';
import { VscodeLogger } from './utilities/VscodeLogger';
import { VscodeExtensionConfig } from './VscodeExtensionConfig';
import { Container as IoCContainer, interfaces } from 'inversify';
import { ExtensionContext } from 'vscode';
import getDecorators from 'inversify-inject-decorators';

const container = new IoCContainer();

container.bind(TypeScriptHero).to(TypeScriptHero).inSingletonScope();
container.bind(iocSymbols.configuration).to(VscodeExtensionConfig).inSingletonScope();
container.bind(TypescriptParser).to(TypescriptParser);

// // Providers
// injector.bind(GuiProvider).to(GuiProvider).inSingletonScope();
// injector.bind(ResolveQuickPickProvider).to(ResolveQuickPickProvider).inSingletonScope();
// injector.bind(ResolveCompletionItemProvider).to(ResolveCompletionItemProvider).inSingletonScope();
// injector.bind(TypescriptCodeActionProvider).to(TypescriptCodeActionProvider).inSingletonScope();

// // Symbol resolving
// injector.bind(ResolveIndex).to(ResolveIndex).inSingletonScope();
// injector.bind(TsResourceParser).to(TsResourceParser);

// Extensions
container.bind<BaseExtension>(iocSymbols.extensions).to(ImportResolveExtension).inSingletonScope();
// injector.bind<BaseExtension>('Extension').to(RestartDebuggerExtension).inSingletonScope();
// injector.bind<BaseExtension>('Extension').to(CodeFixExtension).inSingletonScope();

// Logging
container
    .bind<interfaces.Factory<Logger>>(iocSymbols.loggerFactory)
    .toFactory<Logger>((context: interfaces.Context) => {
        return (prefix?: string) => {
            const extContext = context.container.get<ExtensionContext>(iocSymbols.extensionContext),
                config = context.container.get<ExtensionConfig>(iocSymbols.configuration);
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
export const IocDecorators = getDecorators(container);
