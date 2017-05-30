import { ServerConnection } from '../utilities/ServerConnection';
import { InitializeParams } from 'vscode-languageserver';

/**
 * Interface for a ServerExtension part of the server.
 * 
 * @export
 * @interface ServerExtension
 */
export interface ServerExtension {
    /**
     * Method that is called by the main entry point of the server. Initializes the given part
     * with the connection and the init params.
     * 
     * @param {ServerConnection} connection
     * @param {InitializeParams} params
     * 
     * @memberOf ServerExtension
     */
    initialize(connection: ServerConnection, params: InitializeParams): void;

    /**
     * Method that is called by the main entry point of the server. Shuts down the server when
     * VSCode exists.
     * 
     * @memberOf ServerExtension
     */
    exit(): void;
}
