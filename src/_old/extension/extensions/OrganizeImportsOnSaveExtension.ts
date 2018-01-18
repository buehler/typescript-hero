import { inject, injectable } from 'inversify';
import { ExtensionContext, workspace } from 'vscode';

import { ConfigFactory } from '../../common/factories';
import { iocSymbols } from '../IoCSymbols';
import { ImportManager } from '../managers';
import { Logger } from '../utilities/winstonLogger';
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

    constructor(
        @inject(iocSymbols.extensionContext) context: ExtensionContext,
        @inject(iocSymbols.logger) private logger: Logger,
        @inject(iocSymbols.configuration) private config: ConfigFactory,
    ) {
        super(context);
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
                this.logger.debug(
                    '[%s] organizeOnSave is deactivated through config',
                    OrganizeImportsOnSaveExtension.name,
                );
                return;
            }
            if (this.compatibleLanguages.indexOf(event.document.languageId) < 0) {
                this.logger.debug(
                    '[%s] organizeOnSave not possible for given language',
                    OrganizeImportsOnSaveExtension.name,
                    { language: event.document.languageId },
                );
                return;
            }

            this.logger.info(
                '[%s] organizeOnSave for file',
                OrganizeImportsOnSaveExtension.name,
                { file: event.document.fileName },
            );
            event.waitUntil(
                ImportManager
                    .create(event.document)
                    .then(manager => manager.organizeImports().calculateTextEdits()),
            );
        }));

        this.logger.info('[%s] initialized', OrganizeImportsOnSaveExtension.name);
    }

    /**
     * Disposes the extension.
     *
     * @memberof OrganizeImportsOnSaveExtension
     */
    public dispose(): void {
        this.logger.info('[%s] disposed', OrganizeImportsOnSaveExtension.name);
    }
}
