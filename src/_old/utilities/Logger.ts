import { ExtensionConfig } from '../ExtensionConfig';
import { injectable } from 'inversify';
import * as util from 'util';
import { ExtensionContext, OutputChannel, window } from 'vscode';

/**
 * Factory type for IoC.
 * 
 * @typedef LoggerFactory
 */
export type LoggerFactory = (prefix?: string) => Logger;

/**
 * Enum for the log level. Determines if a message is logged into the output.
 * 
 * @export
 * @enum {number}
 */
export const enum LogLevel {
    Nothing,
    Errors,
    Warnings,
    All
}

/**
 * Central logger instance of the extension.
 * 
 * @export
 * @class Logger
 */
@injectable()
export class Logger {
    private static channel: OutputChannel;

    constructor(context: ExtensionContext, private config: ExtensionConfig, private prefix?: string) {
        if (!Logger.channel) {
            Logger.channel = window.createOutputChannel('Typescript Hero Extension');
            context.subscriptions.push(Logger.channel);
        }
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
        this.log(LogLevel.Errors, `ERROR\t ${message}`, data);
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
        this.log(LogLevel.Warnings, `WARNING\t ${message}`, data);
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
        this.log(LogLevel.All, `INFO\t ${message}`, data);
    }

    /**
     * Internal method to actually do the logging. Checks if the output should be done and logs
     * the data into the output channel and the console (if debugging).
     * 
     * @private
     * @param {LogLevel} level
     * @param {string} message
     * @param {*} [data]
     * 
     * @memberOf Logger
     */
    private log(level: LogLevel, message: string, data?: any): void {
        if (this.config.logLevel >= level) {
            // tslint:disable-next-line
            console.log(`${this.prefix ? `${this.prefix}: ` : ''}${message}`, data);
            Logger.channel.appendLine(`${this.prefix ? `${this.prefix}: ` : ''}${message}`);
            if (data) {
                Logger.channel.appendLine(`\tData:\t${util.inspect(data, {})}`);
            }
        }
    }
}
