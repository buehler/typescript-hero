import { Foo } from './server/indices/foobar';
import { Loggee } from './utilities/Logger';
import winstonLogger, { Logger } from './utilities/Logger';

import iocSymbols from './ioc-symbols';

function foo() {
  console.log(winstonLogger, Logger, Loggee, iocSymbols);
}

Foo
