import {ResolveCache} from './caches/ResolveCache';
import {ExtensionConfig} from './ExtensionConfig';
import {BaseExtension} from './extensions/BaseExtension';
import {ResolveExtension} from './extensions/ResolveExtension';
import {RestartDebuggerExtension} from './extensions/RestartDebuggerExtension';
import {ResolveItemFactory} from './factories/ResolveItemFactory';
import {TsResolveFileParser} from './parser/TsResolveFileParser';
import {GuiProvider} from './provider/GuiProvider';
import {QuickPickProvider} from './provider/QuickPickProvider';
import {TypeScriptHero} from './TypeScriptHero';
import {Kernel} from 'inversify';

let injector = new Kernel();

injector.bind(TypeScriptHero).to(TypeScriptHero).inSingletonScope();
injector.bind(ExtensionConfig).to(ExtensionConfig).inSingletonScope();

injector.bind(QuickPickProvider).to(QuickPickProvider).inSingletonScope();
injector.bind(GuiProvider).to(GuiProvider).inSingletonScope();

injector.bind(ResolveCache).to(ResolveCache).inSingletonScope();
injector.bind(TsResolveFileParser).to(TsResolveFileParser);
injector.bind(ResolveItemFactory).to(ResolveItemFactory);

injector.bind<BaseExtension>('Extension').to(ResolveExtension).inSingletonScope();
injector.bind<BaseExtension>('Extension').to(RestartDebuggerExtension).inSingletonScope();

export const Injector = injector;
