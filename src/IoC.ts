import {ResolveCache} from './caches/ResolveCache';
import {ResolveIndex} from './caches/ResolveIndex';
import {ExtensionConfig} from './ExtensionConfig';
import {BaseExtension} from './extensions/BaseExtension';
import {ResolveExtension} from './extensions/ResolveExtension';
import {RestartDebuggerExtension} from './extensions/RestartDebuggerExtension';
import {ResolveItemFactory} from './factories/ResolveItemFactory';
import {TsResolveFileParser} from './parser/TsResolveFileParser';
import {TsResourceParser} from './parser/TsResourceParser';
import {GuiProvider} from './provider/GuiProvider';
import {ResolveCompletionItemProvider} from './provider/ResolveCompletionItemProvider';
import {ResolveQuickPickProvider} from './provider/ResolveQuickPickProvider';
import {TypeScriptHero} from './TypeScriptHero';
import {Logger} from './utilities/Logger';
import {interfaces, Kernel} from 'inversify';
import {ExtensionContext} from 'vscode';

let injector = new Kernel();

injector.bind(TypeScriptHero).to(TypeScriptHero).inSingletonScope();
injector.bind(ExtensionConfig).to(ExtensionConfig).inSingletonScope();

injector.bind(ResolveQuickPickProvider).to(ResolveQuickPickProvider).inSingletonScope();
injector.bind(ResolveCompletionItemProvider).to(ResolveCompletionItemProvider).inSingletonScope();
injector.bind(GuiProvider).to(GuiProvider).inSingletonScope();

injector.bind(ResolveCache).to(ResolveCache).inSingletonScope();
injector.bind(TsResolveFileParser).to(TsResolveFileParser);
injector.bind(ResolveItemFactory).to(ResolveItemFactory);

injector.bind(ResolveIndex).to(ResolveIndex);
injector.bind(TsResourceParser).to(TsResourceParser);

injector.bind<BaseExtension>('Extension').to(ResolveExtension).inSingletonScope();
injector.bind<BaseExtension>('Extension').to(RestartDebuggerExtension).inSingletonScope();

injector.bind<interfaces.Factory<Logger>>('LoggerFactory').toFactory<Logger>((context: interfaces.Context) => {
    return (prefix?: string) => {
        let extContext = context.kernel.get<ExtensionContext>('context'),
            config = context.kernel.get<ExtensionConfig>(ExtensionConfig);
        return new Logger(extContext, config, prefix);
    };
});

export const Injector = injector;
