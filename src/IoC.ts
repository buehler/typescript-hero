import * as inversify from 'inversify';
import {TypeScriptHero} from './TypeScriptHero';
import {ExtensionConfig} from './ExtensionConfig';
import {ResolveCache} from './caches/ResolveCache';
import {ResolveExtension} from './extensions/ResolveExtension';
import {TsResolveFileParser} from './parser/TsResolveFileParser';

let injector = new inversify.Kernel();

injector.bind(TypeScriptHero).to(TypeScriptHero).inSingletonScope();
injector.bind(ExtensionConfig).to(ExtensionConfig).inSingletonScope();

injector.bind(ResolveExtension).to(ResolveExtension).inSingletonScope();
injector.bind(ResolveCache).to(ResolveCache);
injector.bind(TsResolveFileParser).to(TsResolveFileParser);

export const Injector = injector;
