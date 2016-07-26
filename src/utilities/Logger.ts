import {Configuration} from './Configuration';

export class Logger {
    private static _instance: Logger = new Logger();

    public static get instance(): Logger {
        return Logger._instance;
    }

    constructor() {
        if (Logger._instance) {
            throw new TypeError('Logger cannot be instantiated');
        }
    }

    public log(message?: string, ...additional: any[]): void {
        if (Configuration.debug) {
            console.log(`typescriptHero: ${message}`, ...additional);
        }
    }

    public warn(message?: string, ...additional: any[]): void {
        if (Configuration.debug) {
            console.warn(`typescriptHero: ${message}`, ...additional);
        }
    }

    public error(message?: string, ...additional: any[]): void {
        if (Configuration.debug) {
            console.error(`typescriptHero: ${message}`, ...additional);
        }
    }
}
