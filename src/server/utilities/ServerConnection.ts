import { Connection } from '../../common/communication';
import { ExtensionConfig } from '../../common/config';
import { ServerExtension } from '../extensions/ServerExtension';
import { Container } from '../IoC';
import { iocSymbols } from '../IoCSymbols';
import { injectable } from 'inversify';
import { createConnection, IConnection, IPCMessageReader, IPCMessageWriter, FileEvent } from 'vscode-languageserver';

/**
 * Serverside connection to the client. Masks the {IConnection} with some convenience methods
 * and multi registerable handlers.
 * 
 * @export
 * @class ServerConnection
 */
@injectable()
export class ServerConnection extends Connection<IConnection> {
    private started: boolean;

    constructor() {
        super(createConnection(new IPCMessageReader(process), new IPCMessageWriter(process)));
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
     * Registers a handler for the onDidChangeConfiguration notification.
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

    /**
     * Registers a handler for the onDidChangeWatchedFiles notification.
     * 
     * @param {(changes: FileEvent[]) => void} handler
     * 
     * @memberOf ServerConnection
     */
    public onDidChangeWatchedFiles(handler: (changes: FileEvent[]) => void): void {
        if (!this.handler['onDidChangeWatchedFiles']) {
            this.handler['onDidChangeWatchedFiles'] = [];
            this.connection.onDidChangeWatchedFiles(
                params => this.handler['onDidChangeWatchedFiles'].forEach(o => o(params.changes))
            );
        }
        this.handler['onDidChangeWatchedFiles'].push(handler);
    }
}
