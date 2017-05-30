import { ExtensionConfig } from '../../common/config';
import { Logger, LogLevel } from '../../common/utilities';
import { inspect } from 'util';
import { ExtensionContext, OutputChannel, window } from 'vscode';

/**
 * Central logger instance of the extension.
 * 
 * @export
 * @class VscodeLogger
 */
export class VscodeLogger implements Logger {
    private static channel: OutputChannel;

    constructor(context: ExtensionContext, private config: ExtensionConfig, public readonly prefix?: string) {
        if (!VscodeLogger.channel) {
            VscodeLogger.channel = window.createOutputChannel('TypeScript Hero Extension');
            context.subscriptions.push(VscodeLogger.channel);
        }
    }

    /**
     * Logs an error message. Provided data is logged out after the message.
     * 
     * @param {string} message
     * @param {*} [data]
     * 
     * @memberOf VscodeLogger
     */
    public error(message: string, data?: any): void {
        this.log(
            LogLevel.Errors,
            'Error',
            message,
            data,
        );
    }

    /**
     * Logs a warning message. Provided data is logged out after the message.
     * 
     * @param {string} message
     * @param {*} [data]
     * 
     * @memberOf VscodeLogger
     */
    public warning(message: string, data?: any): void {
        this.log(
            LogLevel.Warnings,
            'Warn ',
            message,
            data,
        );
    }

    /**
     * Logs an info message. Provided data is logged out after the message.
     * 
     * @param {string} message
     * @param {*} [data]
     * 
     * @memberOf VscodeLogger
     */
    public info(message: string, data?: any): void {
        this.log(
            LogLevel.All,
            'Info ',
            message,
            data,
        );
    }

    /**
     * Internal method to actually do the logging. Checks if the output should be done and logs
     * the data into the output channel and the console (if debugging).
     * 
     * @private
     * @param {LogLevel} level
     * @param {string} severity
     * @param {string} message
     * @param {*} [data]
     * 
     * @memberOf VscodeLogger
     */
    private log(level: LogLevel, severity: string, message: string, data?: any): void {
        if (this.getLogLevel() >= level) {
            const msg = `[${severity} - ${this.getDate()}] ${this.prefix ? this.prefix + ' - ' : ''}${message}`;
            // tslint:disable
            if (data) {
                console.log(msg, data);
            } else {
                console.log(msg);
            }
            // tslint:enable
            VscodeLogger.channel.appendLine(msg);
            if (data) {
                VscodeLogger.channel.appendLine(`\tData:\t${inspect(data, {})}`);
            }
        }
    }

    /**
     * Returns a propper formatted date for logging.
     * 
     * @private
     * @returns {string}
     * 
     * @memberOf Logger
     */
    private getDate(): string {
        const date = new Date();
        let hours = date.getHours().toString();
        let minutes = date.getMinutes().toString();
        let seconds = date.getSeconds().toString();

        if (hours.length < 2) {
            hours = `0${hours}`;
        }
        if (minutes.length < 2) {
            minutes = `0${minutes}`;
        }
        if (seconds.length < 2) {
            seconds = `0${seconds}`;
        }
        return `${hours}:${minutes}:${seconds}`;
    }

    /**
     * Maps the configuration string to a propper enum value of LogLevel.
     * 
     * @private
     * @returns {LogLevel}
     * 
     * @memberOf VscodeLogger
     */
    private getLogLevel(): LogLevel {
        switch (this.config.verbosity) {
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
}
