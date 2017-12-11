import { ExtensionContext, OutputChannel, window } from 'vscode';

const { createLogger, exceptions, format, transports } = require('winston');
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
    constructor(opts: any, private channel: OutputChannel) {
        super(opts);
    }

    public log(info: any, callback: any): void {
        setImmediate(() => {
            this.emit('logged', info);
        });
        this.channel.appendLine(info[MESSAGE]);
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

// class HandleUncatchedException extends Transport {
//     constructor(private path: string) {
//         super();
//     }

//     public async log(info: any, callback: any): Promise<void> {
//         setImmediate(() => {
//             this.emit('logged', info);
//         });

//         const result = await window.showErrorMessage(
//             'There was an uncaught exception, do you want to see the logfile?',
//             { modal: true },
//             'Yes, show me.',
//         );

//         if (result) {
//             const doc = await workspace.openTextDocument(join(this.path, 'typescript-hero.log'));
//             await window.showTextDocument(doc);
//         }

//         callback();
//     }
// }

export interface Logger {
    error: (message: string, ...data: any[]) => void;
    warn: (message: string, ...data: any[]) => void;
    info: (message: string, ...data: any[]) => void;
    debug: (message: string, ...data: any[]) => void;
    profile: (name: string) => void;
    startTimer(): { done: (info: { message: string }) => void; };
}

const loggerTransports = [
    new ConsoleLogTransport({
        level: !!process.env.CI ? 'error' : 'debug',
    }),
];

export default function winstonLogger(verbosity: keyof typeof levels, context: ExtensionContext): Logger {
    const level = !!process.env.CI ? 'error' : verbosity;

    if (!process.env.CI && !process.env.EXT_DEBUG) {
        const channel = window.createOutputChannel('TypeScript Hero');
        context.subscriptions.push(channel);

        const fileHandler = new transports.File({
            level: ['info', 'debug'].indexOf(level) >= 0 ? level : 'info',
            exitOnError: false,
            filename: 'typescript-hero.log',
            dirname: context.extensionPath,
            maxsize: 1024 * 1024,
            maxFiles: 1,
            tailable: true,
        });
        const outputHandler = new OutputWindowTransport({ exitOnError: false }, channel);

        loggerTransports.push(fileHandler);
        loggerTransports.push(outputHandler);

        exceptions.handle(fileHandler);
        // exceptions.handle(outputHandler);
        // exceptions.handle(new HandleUncatchedException(context.extensionPath));
    }

    const logger = createLogger({
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
    });

    logger.exitOnError = false;

    return logger;
}
