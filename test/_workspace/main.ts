import ImportOrganizer from './import-organizer';
import ImportManager from './import-organizer/ImportManager';
import iocSymbols, { ImportManagerProvider } from './ioc-symbols';
import TypescriptHero from './typescript-hero';
import winstonLogger, { Logger } from './utilities/Logger';

function foo() {
  console.log(winstonLogger, Logger, iocSymbols);
}
