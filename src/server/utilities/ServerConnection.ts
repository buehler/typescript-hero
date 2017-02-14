import { ExtensionConfig } from '../../common/config';
import { ServerExtension } from '../extensions/ServerExtension';
import { Container } from '../IoC';
import { iocSymbols } from '../IoCSymbols';
import { injectable } from 'inversify';
import { GenericNotificationHandler, GenericRequestHandler } from 'vscode-jsonrpc';
import { createConnection, IConnection, IPCMessageReader, IPCMessageWriter } from 'vscode-languageserver';

/**
 * Serverside connection to the client. Masks the {IConnection} with some convenience methods
 * and multi registerable handlers.
 * 
 * @export
 * @class ServerConnection
 */
@injectable()
export class ServerConnection {
    private handler: { [key: string]: Function[] } = {};
    private connection: IConnection;
    private started: boolean;

    constructor() {
        this.connection = createConnection(new IPCMessageReader(process), new IPCMessageWriter(process));
    }

    /**
     * Starts the actual connection to listen for clients.
     * 
     * @memberOf ServerConnection
     */
    public start(): void {
        if (this.started) {
            throw new Error('Server already started.');
        }

        const extensions = Container.getAll<ServerExtension>(iocSymbols.extensions);

        this.connection.onInitialize(params => {
            extensions.forEach(o => o.initialize(this, params));
            return {
                capabilities: {}
            };
        });
        this.connection.onShutdown(() => {
            extensions.forEach(o => o.exit());
        });

        this.connection.listen();
        this.started = true;
    }

    /**
     * Sends a request to a client and eventually resolves to the result.
     * 
     * @template T
     * @param {string} method
     * @param {*} params
     * @returns {Thenable<T>}
     * 
     * @memberOf ClientConnection
     */
    public sendRequest<T>(method: string, params: any): Thenable<T> {
        return this.connection.sendRequest(method, params);
    }

    /**
     * Sends a notification to the client.
     * 
     * @param {string} method
     * @param {...any[]} args
     * 
     * @memberOf ServerConnection
     */
    public sendNotification(method: string, ...args: any[]): void {
        this.connection.sendNotification(method, ...args);
    }

    /**
     * Registers a notification handler to the connection. All notification handler
     * are called when a notification is hit.
     * 
     * @param {string} method
     * @param {GenericNotificationHandler} handler
     * 
     * @memberOf ServerConnection
     */
    public onNotification(method: string, handler: GenericNotificationHandler): void {
        if (!this.handler[method]) {
            this.handler[method] = [];
            this.connection.onNotification(
                method,
                params => this.handler[method].forEach(o => o(params))
            );
        }
        this.handler[method].push(handler);
    }

    /**
     * Registers a request handler to the connection. When another request handler
     * with the same method is registered, the old one is overwritten.
     *
     * @template TResult
     * @template TError
     * @param {string} method
     * @param {GenericRequestHandler<TResult, TError>} handler
     * 
     * @memberOf ServerConnection
     */
    public onRequest<TResult, TError>(method: string, handler: GenericRequestHandler<TResult, TError>): void {
        this.connection.onRequest(method, handler);
    }

    /**
     * Registers a handler for the onDidChangeConfiguration() notification.
     * 
     * @memberOf ServerConnection
     */
    public onDidChangeConfiguration(handler: (settings: ExtensionConfig) => void): void {
        if (!this.handler['onDidChangeConfiguration']) {
            this.handler['onDidChangeConfiguration'] = [];
            this.connection.onDidChangeConfiguration(
                params => this.handler['onDidChangeConfiguration'].forEach(o => o(params.settings.typescriptHero))
            );
        }
        this.handler['onDidChangeConfiguration'].push(handler);
    }
}
