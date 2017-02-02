/**
 * Factory type for IoC.
 * 
 * @typedef LoggerFactory
 */
export type LoggerFactory = (prefix?: string) => Logger;

/**
 * Interface for logging instances, implement the basic methods needed for logging.
 * If a prefix is provided, it should use it before all messages.
 * 
 * @export
 * @interface Logger
 */
export interface Logger {
    /**
     * The prefix used for the messages.
     * 
     * @type {string}
     * @memberOf Logger
     */
    readonly prefix?: string;

    /**
     * Logs a message marked as error. If additional data is provided, it's logged as well.
     * 
     * @param {string} message
     * @param {*} [data]
     * 
     * @memberOf Logger
     */
    error(message: string, data?: any): void;

    /**
     * Logs a message marked as warning. If additional data is provided, it's logged as well.
     * 
     * @param {string} message
     * @param {*} [data]
     * 
     * @memberOf Logger
     */
    warning(message: string, data?: any): void;

    /**
     * Logs a message marked as info. If additional data is provided, it's logged as well.
     * 
     * @param {string} message
     * @param {*} [data]
     * 
     * @memberOf Logger
     */
    info(message: string, data?: any): void;
}
