import {ResolveCompletionItemProvider} from './provider/ResolveCompletionItemProvider';
import {ResolveIndex} from './caches/ResolveIndex';
import {ExtensionConfig} from './ExtensionConfig';
import {BaseExtension} from './extensions/BaseExtension';
import {ResolveExtension} from './extensions/ResolveExtension';
import {RestartDebuggerExtension} from './extensions/RestartDebuggerExtension';
import {TsResourceParser} from './parser/TsResourceParser';
import {GuiProvider} from './provider/GuiProvider';
import {ResolveQuickPickProvider} from './provider/ResolveQuickPickProvider';
import {TypeScriptHero} from './TypeScriptHero';
import {Logger} from './utilities/Logger';
import {interfaces, Kernel} from 'inversify';
import {ExtensionContext} from 'vscode';

let injector = new Kernel();

injector.bind(TypeScriptHero).to(TypeScriptHero).inSingletonScope();
injector.bind(ExtensionConfig).to(ExtensionConfig).inSingletonScope();

// Providers
injector.bind(GuiProvider).to(GuiProvider).inSingletonScope();
injector.bind(ResolveQuickPickProvider).to(ResolveQuickPickProvider).inSingletonScope();

// Symbol resolving
injector.bind(ResolveIndex).to(ResolveIndex).inSingletonScope();
injector.bind(TsResourceParser).to(TsResourceParser);

// Completion provider
injector.bind(ResolveCompletionItemProvider).to(ResolveCompletionItemProvider).inSingletonScope();

// Extensions
injector.bind<BaseExtension>('Extension').to(ResolveExtension).inSingletonScope();
injector.bind<BaseExtension>('Extension').to(RestartDebuggerExtension).inSingletonScope();

// Logging
injector.bind<interfaces.Factory<Logger>>('LoggerFactory').toFactory<Logger>((context: interfaces.Context) => {
    return (prefix?: string) => {
        let extContext = context.kernel.get<ExtensionContext>('context'),
            config = context.kernel.get<ExtensionConfig>(ExtensionConfig);
        return new Logger(extContext, config, prefix);
    };
});

export const Injector = injector;
