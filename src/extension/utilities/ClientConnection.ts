import { join } from 'path';
import { ExtensionContext, workspace } from 'vscode';
import { LanguageClient, LanguageClientOptions, ServerOptions, TransportKind } from 'vscode-languageclient';

/**
 * Clientside connection to the server. Masks the {LanguageClient} with some convenience methods
 * and multi registerable handlers.
 * 
 * @export
 * @class ClientConnection
 */
export class ClientConnection {

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
                    workspace.createFileSystemWatcher('{**/*.ts,**/package.json,**/typings.json}', true)
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
     * TODO
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
     * TODO
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

    // /**
    //  * TODO
    //  * 
    //  * @template T
    //  * @param {string} method
    //  * @returns {Observable<T>}
    //  * 
    //  * @memberOf ClientConnection
    //  */
    // public onNotification<T>(method: string): Observable<T> {
    //     if (!this.handler[method]) {
    //         this.handler[method] = new Subject<T>();
    //         this.endpoint.onNotification(method, param => this.handler[method].next(param));
    //     }
    //     return this.handler[method];
    // }

    // /**
    //  * TODO
    //  * 
    //  * @template TResult
    //  * @template TError
    //  * @param {string} method
    //  * @param {GenericRequestHandler<TResult, TError>} handler
    //  * 
    //  * @memberOf ClientConnection
    //  */
    // public onRequest<TResult, TError>(
    //     method: string,
    //     handler: GenericRequestHandler<TResult, TError>
    // ): void {
    //     this.endpoint.onRequest(method, handler);
    // }
}
