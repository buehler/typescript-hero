import {Logger, LoggerFactory} from '../utilities/Logger';
import {inject, injectable} from 'inversify';

@injectable()
export class ResolveIndex {
    private logger: Logger;

    constructor( @inject('LoggerFactory') loggerFactory: LoggerFactory) {
        this.logger = loggerFactory('ResolveCache');
    }
}
