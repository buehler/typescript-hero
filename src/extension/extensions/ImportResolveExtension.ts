import { Logger, LoggerFactory } from '../../common/utilities';
import { iocSymbols } from '../IoCSymbols';
import { BaseExtension } from './BaseExtension';
import { inject, injectable } from 'inversify';
import { ExtensionContext } from 'vscode';

@injectable()
export class ImportResolveExtension extends BaseExtension {
    private logger: Logger;
    
    constructor(
        @inject(iocSymbols.extensionContext) context: ExtensionContext,
        @inject(iocSymbols.loggerFactory) loggerFactory: LoggerFactory
    ) {
        super(context);
        this.logger = loggerFactory('ImportResolveExtension');
    }

    /**
     * Initialized the extension. Registers the commands and other disposables to the context.
     * 
     * @memberOf ImportResolveExtension
     */
    public initialize(): void {
        this.logger.info('Initialized');
    }

    /**
     * Disposes the extension.
     * 
     * @memberOf ImportResolveExtension
     */
    public dispose(): void {
        this.logger.info('Disposed');
    }
}
