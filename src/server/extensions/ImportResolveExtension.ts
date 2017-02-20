import { Notification, Request } from '../../common/communication';
import { getDeclarationsFilteredByImports } from '../../common/helpers';
import { TypescriptParser } from '../../common/ts-parsing';
import { DeclarationInfo } from '../../common/ts-parsing/declarations';
import { Logger, LoggerFactory } from '../../common/utilities';
import { DeclarationIndex } from '../indices/DeclarationIndex';
import { iocSymbols } from '../IoCSymbols';
import { ServerConnection } from '../utilities/ServerConnection';
import { ServerExtension } from './ServerExtension';
import { inject, injectable } from 'inversify';
import { FileEvent, InitializeParams } from 'vscode-languageserver';

type DeclarationsForImportOptions = { cursorSymbol: string, documentSource: string, documentPath: string };

/**
 * Server part of the import resolver extension. Contains the symbol index and response to the
 * requests and notifications of the client. Provides the symbol information to the client.
 * 
 * @export
 * @class ImportResolveExtension
 * @implements {ServerExtension}
 */
@injectable()
export class ImportResolveExtension implements ServerExtension {
    private rootUri: string | null;
    private logger: Logger;
    private connection: ServerConnection;

    constructor(
        @inject(iocSymbols.loggerFactory) loggerFactory: LoggerFactory,
        private index: DeclarationIndex,
        private parser: TypescriptParser
    ) {
        this.logger = loggerFactory('ImportResolveExtension');
    }

    /**
     * Method that is called by the main entry point of the server. Initializes the given part
     * with the connection and the init params.
     * 
     * @param {ServerConnection} connection
     * @param {InitializeParams} params
     * 
     * @memberOf ImportResolveExtension
     */
    public initialize(connection: ServerConnection, params: InitializeParams): void {
        this.rootUri = params.rootUri;
        this.connection = connection;

        connection.onDidChangeWatchedFiles(changes => this.watchedFilesChanged(changes));
        connection.onNotification(Notification.CreateIndexForFiles, files => this.buildIndex(files));
        connection.onRequest(Request.DeclarationIndexReady, () => this.index.indexReady);
        connection.onSerializedRequest(
            Request.DeclarationInfosForImport, options => this.getDeclarationsForImport(options)
        );

        this.logger.info('Initialized');
    }

    /**
     * Method that is called by the main entry point of the server. Shuts down the server when
     * VSCode exists.
     * 
     * @memberOf ImportResolveExtension
     */
    public exit(): void {
        this.logger.info('Exit');
    }

    /**
     * Called when the watched files are changed so new / modified ones can be reindexed and deleted ones removed.
     * 
     * @private
     * @param {FileEvent[]} changes
     * @returns {Promise<void>}
     * 
     * @memberOf ImportResolveExtension
     */
    private async watchedFilesChanged(changes: FileEvent[]): Promise<void> {
        if (!this.rootUri) {
            this.logger.warning('No workspace opened, will not proceed.');
            return;
        }
        try {
            this.logger.info(`Watched files have changed, processing ${changes.length} changes.`);
            this.connection.sendNotification(Notification.IndexCreationRunning);
            await this.index.reindexForChanges(changes, this.rootUri);
            this.connection.sendNotification(Notification.IndexCreationSuccessful);
            this.logger.info('Index rebuild successful.');
        } catch (e) {
            this.logger.error('There was an error during reprocessing changed files.', e);
            this.connection.sendNotification(Notification.IndexCreationFailed);
        }
    }

    /**
     * Builds the declaration index for the given files. Is the entry point for the server connection to interact
     * with.
     * 
     * @private
     * @param {string[]} files
     * @returns {Promise<void>}
     * 
     * @memberOf ImportResolveExtension
     */
    private async buildIndex(files: string[]): Promise<void> {
        if (!this.rootUri) {
            this.logger.warning('No workspace opened, will not proceed.');
            this.connection.sendNotification(Notification.IndexCreationSuccessful);
            return;
        }

        this.logger.info(`Build new index for ${files.length} files.`);

        try {
            await this.index.buildIndex(files, this.rootUri);
            this.logger.info('Index successfully built.');
            this.connection.sendNotification(Notification.IndexCreationSuccessful);
        } catch (e) {
            this.logger.error('There was an error during the build of the index.', e);
            this.connection.sendNotification(Notification.IndexCreationFailed);
        }
    }

    /**
     * Calculates the possible imports for a given document source with a filter for the given symbol.
     * Returns a list of declaration infos that may be used for select picker or something.
     * 
     * @private
     * @param {DeclarationsForImportOptions} {cursorSymbol, documentSource, documentPath}
     * @returns {(Promise<DeclarationInfo[] | undefined>)}
     * 
     * @memberOf ImportResolveExtension
     */
    private async getDeclarationsForImport(
        {cursorSymbol, documentSource, documentPath}: DeclarationsForImportOptions
    ): Promise<DeclarationInfo[] | undefined> {
        if (!this.rootUri) {
            this.logger.warning('No workspace opened, will not proceed.');
            return;
        }

        this.logger.info(`Calculate possible imports for document with filter "${cursorSymbol}"`);

        const parsedSource = await this.parser.parseSource(documentSource),
            activeDocumentDeclarations = parsedSource.declarations.map(o => o.name),
            declarations = getDeclarationsFilteredByImports(
                this.index.declarationInfos,
                documentPath,
                this.rootUri,
                parsedSource.imports
            ).filter(o => o.declaration.name.startsWith(cursorSymbol));

        return [
            ...declarations.filter(o => o.from.startsWith('/')),
            ...declarations.filter(o => !o.from.startsWith('/'))
        ].filter(o => activeDocumentDeclarations.indexOf(o.declaration.name) === -1);
    }
}
