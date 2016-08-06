import {ExtensionConfig} from '../ExtensionConfig';
import {injectable} from 'inversify';
import {ExtensionContext, OutputChannel, window} from 'vscode';

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
        
    }

    public warning(message: string, data?: any): void {

    }
    
    public info(message: string, data?: any): void {

    }

    private log(level: LogLevel, message: string, data?: any): void {
        
    }
}
