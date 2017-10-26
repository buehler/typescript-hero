import { inject, injectable } from 'inversify';
import { ExtensionContext, workspace } from 'vscode';

import { ConfigFactory } from '../../common/factories';
import { Logger, LoggerFactory } from '../../common/utilities';
import { iocSymbols } from '../IoCSymbols';
import { ImportManager } from '../managers';
import { BaseExtension } from './BaseExtension';

/**
 * Extension that does sort and organize the imports as soon as a document will be saved.
 *
 * @export
 * @class OrganizeImportsOnSaveExtension
 * @extends {BaseExtension}
 */
@injectable()
export class OrganizeImportsOnSaveExtension extends BaseExtension {
    private compatibleLanguages: string[] = [
        'typescript',
        'typescriptreact',
        'javascript',
        'javascriptreact',
    ];
    private logger: Logger;

    constructor(
        @inject(iocSymbols.extensionContext) context: ExtensionContext,
        @inject(iocSymbols.loggerFactory) loggerFactory: LoggerFactory,
        @inject(iocSymbols.configuration) private config: ConfigFactory,
    ) {
        super(context);
        this.logger = loggerFactory('OrganizeImportsOnSaveExtension');
    }

    /**
     * Initialized the extension. Registers the commands and other disposables to the context.
     *
     * @memberof OrganizeImportsOnSaveExtension
     */
    public initialize(): void {
        this.context.subscriptions.push(workspace.onWillSaveTextDocument((event) => {
            const config = this.config(event.document.uri);
            if (!config.resolver.organizeOnSave) {
                this.logger.info('Organize on save is deactivated through config.');
                return;
            }
            if (this.compatibleLanguages.indexOf(event.document.languageId) < 0) {
                this.logger.info(`Organize imports for languageId "${event.document.languageId}" not possible.`);
                return;
            }

            this.logger.info(`Organize on save for document "${event.document.fileName}".`);
            event.waitUntil(
                ImportManager
                    .create(event.document)
                    .then(manager => manager.organizeImports().calculateTextEdits()),
            );
        }));

        this.logger.info('Initialized');
    }

    /**
     * Disposes the extension.
     *
     * @memberof OrganizeImportsOnSaveExtension
     */
    public dispose(): void {
        this.logger.info('Disposed');
    }
}
