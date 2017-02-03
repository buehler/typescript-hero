import { ServerConnection } from '../utilities/ServerConnection';
import { ServerExtension } from './ServerExtension';
import { injectable } from 'inversify';
import { InitializeParams } from 'vscode-languageserver';

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
    }

    /**
     * Method that is called by the main entry point of the server. Shuts down the server when
     * VSCode exists.
     * 
     * @memberOf ImportResolveExtension
     */
    public exit(): void {
    }
}
