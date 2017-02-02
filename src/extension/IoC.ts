import { TypeScriptHero } from './TypeScriptHero';
import { Container as IoCContainer } from 'inversify';
import getDecorators from 'inversify-inject-decorators';

let container = new IoCContainer();

container.bind(TypeScriptHero).to(TypeScriptHero).inSingletonScope();
// container.bind(ExtensionConfig).to(ExtensionConfig).inSingletonScope();

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

// // Logging
// injector.bind<interfaces.Factory<Logger>>('LoggerFactory').toFactory<Logger>((context: interfaces.Context) => {
//     return (prefix?: string) => {
//         let extContext = context.kernel.get<ExtensionContext>('context'),
//             config = context.kernel.get<ExtensionConfig>(ExtensionConfig);
//         return new Logger(extContext, config, prefix);
//     };
// });

export const Container = container;
export const InjectorDecorators = getDecorators(container);
