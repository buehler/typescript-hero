import * as inversify from 'inversify';
import {TypeScriptHero} from './TypeScriptHero';

let injector = new inversify.Kernel();

injector.bind<TypeScriptHero>(TypeScriptHero).to(TypeScriptHero).inSingletonScope();

export const Injector = injector;
