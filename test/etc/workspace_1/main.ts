import iocSymbols from './ioc-symbols';
import { Foo } from './server/indices/foobar';
import winstonLogger, { Logger } from './utilities/Logger';

function foo() {
  console.log(winstonLogger, Logger, iocSymbols);
}

Foo
