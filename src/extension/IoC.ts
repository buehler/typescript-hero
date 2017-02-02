import { ExtensionConfig } from '../common/config';
import { Logger } from '../common/utilities';
import { TypeScriptHero } from './TypeScriptHero';
import { VscodeLogger } from './utilities/VscodeLogger';
import { VscodeExtensionConfig } from './VscodeExtensionConfig';
import { Container as IoCContainer, interfaces } from 'inversify';
import { ExtensionContext } from 'vscode';
import getDecorators from 'inversify-inject-decorators';

const container = new IoCContainer();
const iocSymbols = {
    configuration: Symbol('config'),
    extensionContext: Symbol('context'),
    extensions: Symbol('extensions'),
    loggerFactory: Symbol('loggerFactory')
};

container.bind(TypeScriptHero).to(TypeScriptHero).inSingletonScope();
container.bind(iocSymbols.configuration).to(VscodeExtensionConfig).inSingletonScope();

// // Providers
// injector.bind(GuiProvider).to(GuiProvider).inSingletonScope();
// injector.bind(ResolveQuickPickProvider).to(ResolveQuickPickProvider).inSingletonScope();
// injector.bind(ResolveCompletionItemProvider).to(ResolveCompletionItemProvider).inSingletonScope();
// injector.bind(TypescriptCodeActionProvider).to(TypescriptCodeActionProvider).inSingletonScope();

// // Symbol resolving
// injector.bind(ResolveIndex).to(ResolveIndex).inSingletonScope();
// injector.bind(TsResourceParser).to(TsResourceParser);

// // Extensions
// injector.bind<BaseExtension>('Extension').to(ResolveExtension).inSingletonScope();
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

export const Container = container;
export const InjectorDecorators = getDecorators(container);
export const Symbols = iocSymbols;
