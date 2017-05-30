import { ExtensionConfig } from '../../common/config';
import { Logger, LogLevel } from '../../common/utilities';
import { ServerConnection } from './ServerConnection';
import * as util from 'util';
import { MessageType } from 'vscode-languageserver';

type LogMessage = { message: string, type: MessageType, level: LogLevel, data: any };

/**
 * Returns the log level for a given verbosity string.
 * 
 * @param {string} verbosity
 * @returns {LogLevel}
 */
function getLogLevel(verbosity: string): LogLevel {
    switch (verbosity) {
        case 'Nothing':
            return LogLevel.Nothing;
        case 'Errors':
            return LogLevel.Errors;
        case 'All':
            return LogLevel.All;
        default:
            return LogLevel.Warnings;
    }
}

/**
 * Central logger instance for the server part.
 * 
 * @export
 * @class ServerLogger
 * @implements {Logger}
 */
export class ServerLogger implements Logger {
    private messageBuffer: LogMessage[] = [];
    private configuration: ExtensionConfig;

    constructor(private connection: ServerConnection, public prefix?: string) {
        connection.onDidChangeConfiguration((config) => {
            this.configuration = config;
            this.trySendBuffer();
        });
    }

    /**
     * Logs an error message. Provided data is logged out after the message.
     * 
     * @param {string} message
     * @param {*} [data]
     * 
     * @memberOf Logger
     */
    public error(message: string, data?: any): void {
        this.log(LogLevel.Errors, MessageType.Error, message, data);
    }

    /**
     * Logs a warning message. Provided data is logged out after the message.
     * 
     * @param {string} message
     * @param {*} [data]
     * 
     * @memberOf Logger
     */
    public warning(message: string, data?: any): void {
        this.log(LogLevel.Warnings, MessageType.Warning, message, data);
    }

    /**
     * Logs an info message. Provided data is logged out after the message.
     * 
     * @param {string} message
     * @param {*} [data]
     * 
     * @memberOf Logger
     */
    public info(message: string, data?: any): void {
        this.log(LogLevel.All, MessageType.Info, message, data);
    }

    /**
     * Internal method to actually do the logging. Checks if the output should be done and logs
     * the data into the output channel and the console (if debugging).
     * 
     * @private
     * @param {LogLevel} level
     * @param {MessageType} type
     * @param {string} message
     * @param {*} [data]
     * 
     * @memberOf Logger
     */
    private log(level: LogLevel, type: MessageType, message: string, data?: any): void {
        let payload = message;
        if (this.configuration && getLogLevel(this.configuration.verbosity) >= level) {
            payload = `${this.prefix ? this.prefix + ' - ' : ''}${payload}`;
            if (data) {
                payload += `\n\tData:\t${util.inspect(data, {})}`;
            }
            this.connection.sendNotification('window/logMessage', { type, payload });
        } else if (!this.configuration && this.messageBuffer) {
            this.messageBuffer.push({ level, type, message: payload, data });
        }
    }

    /**
     * Tries to send the buffer (if one exists).
     * Is executed on initialized and config changes. Can only be called once, since the buffer is
     * destroyed afterwards to prevent memory leaks.
     * 
     * @private
     * 
     * @memberOf Logger
     */
    private trySendBuffer(): void {
        if (this.configuration && this.messageBuffer) {
            for (const { level, type, message, data } of [...this.messageBuffer]) {
                this.log(level, type, message, data);
            }
            delete this.messageBuffer;
        }
    }
}
