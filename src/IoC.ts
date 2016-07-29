import * as inversify from 'inversify';
import {TypeScriptHero} from './TypeScriptHero';
import {ExtensionConfig} from './ExtensionConfig';
import {ResolveCache} from './caches/ResolveCache';
import {ResolveExtension} from './extensions/ResolveExtension';
import {TsResolveFileParser} from './parser/TsResolveFileParser';
import {QuickPickProvider} from './provider/QuickPickProvider';
import {ResolveItemFactory} from './factories/ResolveItemFactory';

let injector = new inversify.Kernel();

injector.bind(TypeScriptHero).to(TypeScriptHero).inSingletonScope();
injector.bind(ExtensionConfig).to(ExtensionConfig).inSingletonScope();

injector.bind(QuickPickProvider).to(QuickPickProvider).inSingletonScope();

injector.bind(ResolveExtension).to(ResolveExtension).inSingletonScope();
injector.bind(ResolveCache).to(ResolveCache).inSingletonScope();
injector.bind(TsResolveFileParser).to(TsResolveFileParser);
injector.bind(ResolveItemFactory).to(ResolveItemFactory);

export const Injector = injector;
