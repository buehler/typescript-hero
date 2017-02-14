import { join } from 'path';
import { ExtensionContext, workspace } from 'vscode';
import { GenericNotificationHandler, GenericRequestHandler } from 'vscode-jsonrpc';
import { LanguageClient, LanguageClientOptions, ServerOptions, TransportKind } from 'vscode-languageclient';

/**
 * Clientside connection to the server. Masks the {LanguageClient} with some convenience methods
 * and multi registerable handlers.
 * 
 * @export
 * @class ClientConnection
 */
export class ClientConnection {
    private handler: { [key: string]: Function[] } = {};

    constructor(private endpoint: LanguageClient) { }

    /**
     * Creates a connection to the server and awaits the "onReady()" event of the connection.
     * 
     * @static
     * @param {ExtensionContext} context
     * @returns {Promise<ClientConnection>}
     * 
     * @memberOf ClientConnection
     */
    public static async create(context: ExtensionContext): Promise<ClientConnection> {
        const module = join(__dirname, '..', '..', 'server', 'TypeScriptHeroServer'),
            options = { execArgv: ['--nolazy', '--debug=6004'] };

        const serverOptions: ServerOptions = {
            run: { module, transport: TransportKind.ipc },
            debug: { module, transport: TransportKind.ipc, options }
        };

        const clientOptions: LanguageClientOptions = {
            documentSelector: ['typescript', 'typescriptreact'],
            synchronize: {
                configurationSection: 'typescriptHero',
                fileEvents: [
                    workspace.createFileSystemWatcher('{**/*.ts,**/*.tsx,**/package.json,**/typings.json}', true)
                ]
            }
        };

        const client = new LanguageClient(
            'typescriptHeroServer', 'TypeScript Hero Server', serverOptions, clientOptions
        );

        context.subscriptions.push(client.start());
        await client.onReady();
        return new ClientConnection(client);
    }

    /**
     * Sends a notification to the server.
     * 
     * @param {string} method
     * @param {...any[]} args
     * 
     * @memberOf ClientConnection
     */
    public sendNotification(method: string, ...args: any[]): void {
        this.endpoint.sendNotification(method, args);
    }

    /**
     * Sends a request to the server.
     * 
     * @template T
     * @param {string} method
     * @param {*} [params]
     * @returns {Thenable<T>}
     * 
     * @memberOf ClientConnection
     */
    public sendRequest<T>(method: string, params?: any): Thenable<T> {
        return this.endpoint.sendRequest(method, params);
    }

    /**
     * Registers a notification handler to the connection. All notification handler
     * are called when a notification is hit.
     * 
     * @param {string} method
     * @param {GenericNotificationHandler} handler
     * 
     * @memberOf ClientConnection
     */
    public onNotification(method: string, handler: GenericNotificationHandler): void {
        if (!this.handler[method]) {
            this.handler[method] = [];
            this.endpoint.onNotification(
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
     * @memberOf ClientConnection
     */
    public onRequest<TResult, TError>(method: string, handler: GenericRequestHandler<TResult, TError>): void {
        this.endpoint.onRequest(method, handler);
    }
}
