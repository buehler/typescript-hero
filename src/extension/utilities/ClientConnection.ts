import { Connection } from '../../common/communication';
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
export class ClientConnection extends Connection<LanguageClient> {
    private constructor(endpoint: LanguageClient) {
        super(endpoint);
    }

    /**
     * Creates a connection to the server and awaits the "onReady()" event of the connection.
     * 
     * @static
     * @param {ExtensionContext} context
     * @returns {Promise<ClientConnection>}
     * 
     * @memberof ClientConnection
     */
    public static async create(context: ExtensionContext): Promise<ClientConnection> {
        const module = join(__dirname, '..', '..', 'server', 'TypeScriptHeroServer');
        const options = { execArgv: ['--nolazy', '--debug=6004'] };

        const serverOptions: ServerOptions = {
            run: { module, transport: TransportKind.ipc },
            debug: { module, transport: TransportKind.ipc, options },
        };

        const clientOptions: LanguageClientOptions = {
            documentSelector: ['typescript', 'typescriptreact'],
            synchronize: {
                configurationSection: 'typescriptHero',
                fileEvents: [
                    workspace.createFileSystemWatcher('{**/*.ts,**/*.tsx,**/package.json,**/typings.json}', true),
                ],
            },
        };

        const client = new LanguageClient(
            'typescriptHeroServer', 'TypeScript Hero Server', serverOptions, clientOptions,
        );

        context.subscriptions.push(client.start());
        await client.onReady();
        return new ClientConnection(client);
    }
}
