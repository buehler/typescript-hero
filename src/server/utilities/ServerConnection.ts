import { ExtensionConfig } from '../../common/config';
import { ServerExtension } from '../extensions/ServerExtension';
import { Container } from '../IoC';
import { iocSymbols } from '../IoCSymbols';
import { injectable } from 'inversify';
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
