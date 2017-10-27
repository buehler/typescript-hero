import { ExtensionContext } from 'vscode';

const { createLogger, format, transports } = require('winston');
const transport = require('winston-transport');
const { LEVEL, MESSAGE } = require('triple-beam');

const { combine, timestamp, printf } = format;
const Transport = transport as { new(...args: any[]): any; };

const levels = {
    error: 0,
    warn: 1,
    info: 2,
    debug: 3,
};

class OutputWindowTransport extends Transport {
    constructor(opts?: any) {
        super(opts);
    }

    public log(info: any, callback: any): void {
        setImmediate(() => {
            this.emit('logged', info);
        });
        const level = info[LEVEL];

        switch (level) {
            case 'error':
                console.error(info[MESSAGE]);
                break;
            case 'warn':
                console.warn(info[MESSAGE]);
                break;
            default:
                console.log(info[MESSAGE]);
                break;
        }
        callback();
    }
}

class ConsoleLogTransport extends Transport {
    constructor(opts?: any) {
        super(opts);
    }

    public log(info: any, callback: any): void {
        setImmediate(() => {
            this.emit('logged', info);
        });
        const level = info[LEVEL];

        switch (level) {
            case 'error':
                console.error(info[MESSAGE]);
                break;
            case 'warn':
                console.warn(info[MESSAGE]);
                break;
            default:
                console.log(info[MESSAGE]);
                break;
        }
        callback();
    }
}

export interface Logger {
    error: (message: string, ...data: any[]) => void;
    warn: (message: string, ...data: any[]) => void;
    info: (message: string, ...data: any[]) => void;
    debug: (message: string, ...data: any[]) => void;
}

const loggerTransports = [
    new ConsoleLogTransport({
        level: !!process.env.CI ? 'error' : 'debug',
    }),
];

export default function winstonLogger(verbosity: keyof typeof levels, context: ExtensionContext): Logger {
    const level = !!process.env.CI ? 'error' : verbosity;

    if (!process.env.CI && !process.env.EXT_DEBUG) {
        loggerTransports.push(new OutputWindowTransport());
    }

    return createLogger({
        level,
        levels,
        format: combine(
            format.splat(),
            timestamp(),
            printf((info) => {
                const message = `${info.timestamp} - ${info.level}: ${info.message}`;
                const data = {
                    ...info,
                    level: undefined,
                    message: undefined,
                    splat: undefined,
                    timestamp: undefined,
                };
                if (Object.keys(data).filter(key => !!data[key]).length > 0) {
                    return `${message} ${JSON.stringify(data)}`;
                }
                return message;
            }),
        ),
        transports: loggerTransports,
    }) as Logger;
}
