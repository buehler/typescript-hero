import { injectable } from 'inversify';
import { TsSerializer } from 'ts-json-serializer';
import { GenericNotificationHandler, GenericRequestHandler } from 'vscode-jsonrpc';

/**
 * List of notifications that are passed between the client and the server.
 * 
 * @export
 * @enum {number}
 */
export enum Notification {
    CreateIndexForFiles,
    IndexCreationRunning,
    IndexCreationSuccessful,
    IndexCreationFailed,
    PartialIndexResult,
    UpdatePartialIndex,
}

/**
 * List of requests that are passed between the client and the server.
 * 
 * @export
 * @enum {number}
 */
export enum Request {
    DeclarationIndexReady,
    DeclarationInfosForImport,
    MissingDeclarationInfosForDocument,
}

type ConnectionEndpoint = {
    sendNotification: (method: string, params: any) => void;
    sendRequest: <T>(method: string, params: any) => Thenable<T>;
    onNotification: (method: string, handler: GenericNotificationHandler) => void;
    onRequest: <TResult, TError>(method: string, handler: GenericRequestHandler<TResult, TError>) => void;
};

/**
 * Base connection class. Does provide the basic functionallity to send and receive notifications.
 * Must be initialized with a concrete implementation of a connection endpoint.
 * 
 * @export
 * @abstract
 * @class Connection
 * @template T
 */
@injectable()
export abstract class Connection<T extends ConnectionEndpoint> {
    protected handler: { [key: string]: Function[] } = {};
    private serializer: TsSerializer = new TsSerializer();

    constructor(protected connection: T) { }

    /**
     * Sends a notification to the other endpoint.
     * 
     * @param {(Notification | string)} notification
     * @param {...any[]} args
     * 
     * @memberOf Connection
     */
    public sendNotification(notification: Notification | string, ...args: any[]): void {
        const method = typeof notification === 'string' ? notification : Notification[notification];
        this.connection.sendNotification(method, args);
    }

    public sendSerializedNotification(notification: Notification | string, ...args: any[]): void {
        const method = typeof notification === 'string' ? notification : Notification[notification];
        const json = this.serializer.serialize(args);
        this.connection.sendNotification(method, json);
    }

    /**
     * Sends a request to the other endpoint.
     * 
     * @template T
     * @param {(Request | string)} request
     * @param {*} [params]
     * @returns {Thenable<T>}
     * 
     * @memberOf Connection
     */
    public sendRequest<T>(request: Request | string, params?: any): Thenable<T> {
        const method = typeof request === 'string' ? request : Request[request];
        return this.connection.sendRequest(method, params);
    }

    /**
     * Sends a request to the other endpoint. The response is serialized and deserialized.
     * 
     * @template T
     * @param {(Request | string)} request
     * @param {*} [params]
     * @returns {Promise<T>}
     * 
     * @memberOf Connection
     */
    public async sendSerializedRequest<T>(request: Request | string, params?: any): Promise<T> {
        const method = typeof request === 'string' ? request : Request[request];
        const json = await this.connection.sendRequest<string>(method, params);

        return this.serializer.deserialize<T>(json);
    }

    /**
     * Registers a notification handler to the connection. All notification handler
     * are called when a notification is hit.
     * 
     * @param {(Notification | string)} notification
     * @param {GenericNotificationHandler} handler
     * 
     * @memberOf Connection
     */
    public onNotification(notification: Notification | string, handler: GenericNotificationHandler): void {
        const method = typeof notification === 'string' ? notification : Notification[notification];
        if (!this.handler[method]) {
            this.handler[method] = [];
            this.connection.onNotification(
                method,
                params => this.handler[method].forEach(o => o(params)),
            );
        }
        this.handler[method].push(handler);
    }
    
    public onSerializedNotification(notification: Notification | string, handler: GenericNotificationHandler): void {
        this.onNotification(notification, (...params: any[]) => {
            if (params) {
                handler(...(params.map(p => this.serializer.deserialize(p))));
                return;
            }
            handler();
        });
    }

    /**
     * Registers a request handler to the connection. When another request handler
     * with the same method is registered, the old one is overwritten.
     *
     * @template TResult
     * @template TError
     * @param {(Request | string)} request
     * @param {GenericRequestHandler<TResult, TError>} handler
     * 
     * @memberOf Connection
     */
    public onRequest<TResult, TError>(
        request: Request | string,
        handler: GenericRequestHandler<TResult, TError>,
    ): void {
        const method = typeof request === 'string' ? request : Request[request];
        this.connection.onRequest(method, handler);
    }

    /**
     * Registers a request handler to the connection. When another request handler
     * with the same method is registered, the old one is overwritten.
     *
     * @template TResult
     * @template TError
     * @param {(Request | string)} request
     * @param {GenericRequestHandler<TResult, TError>} handler
     * 
     * @memberOf Connection
     */
    public onSerializedRequest<TResult, TError>(
        request: Request | string,
        handler: GenericRequestHandler<TResult, TError>,
    ): void {
        const method = typeof request === 'string' ? request : Request[request];
        this.connection.onRequest(method, async (params) => {
            const result = handler(params);

            if (result instanceof Promise) {
                const promiseResult = await result;
                return this.serializer.serialize(promiseResult);
            }

            return this.serializer.serialize(result);
        });
    }
}
