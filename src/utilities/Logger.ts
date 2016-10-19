import { ExtensionConfig } from '../ExtensionConfig';
import { injectable } from 'inversify';
import * as util from 'util';
import { ExtensionContext, OutputChannel, window } from 'vscode';

export type LoggerFactory = (prefix?: string) => Logger;

export const enum LogLevel {
    Nothing,
    Errors,
    Warnings,
    All
}

@injectable()
export class Logger {
    private static channel: OutputChannel;

    constructor(context: ExtensionContext, private config: ExtensionConfig, private prefix?: string) {
        if (!Logger.channel) {
            Logger.channel = window.createOutputChannel('Typescript Hero Extension');
            context.subscriptions.push(Logger.channel);
        }
    }

    public error(message: string, data?: any): void {
        this.log(LogLevel.Errors, `ERROR\t ${message}`, data);
    }

    public warning(message: string, data?: any): void {
        this.log(LogLevel.Warnings, `WARNING\t ${message}`, data);
    }

    public info(message: string, data?: any): void {
        this.log(LogLevel.All, `INFO\t ${message}`, data);
    }

    private log(level: LogLevel, message: string, data?: any): void {
        if (this.config.logLevel >= level) {
            console.log(`${this.prefix ? `${this.prefix}: ` : ''}${message}`, data);
            Logger.channel.appendLine(`${this.prefix ? `${this.prefix}: ` : ''}${message}`);
            if (data) {
                Logger.channel.appendLine(`\tData:\t${util.inspect(data, {})}`);
            }
        }
    }
}
