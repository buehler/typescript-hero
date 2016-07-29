declare module "body-parser" {
    import * as express from "express";

    namespace bodyParser {
        export function json(): express.RequestHandler;

        export function raw(): express.RequestHandler;
    }

    export = bodyParser;    
}

declare module "mime" {
	export function lookup(path: string): string;
	export function extension(mime: string): string;
	export function load(filepath: string): void;
	export function define(mimes: Object): void;

	interface Charsets {
		lookup(mime: string): string;
	}

	export var charsets: Charsets;
	export var default_type: string;
}

export declare class RouteRegistration {
    path: string;
    method: RouteMethod;
    descriptor: PropertyDescriptor;
    propertyKey: string;
    middlewares: RequestHandler[];
    constructor(path: string, method: RouteMethod, descriptor: PropertyDescriptor, propertyKey: string, middlewares?: RequestHandler[]);
}

export declare function Route(route?: string, httpMethod?: RouteMethod, ...middlewares: RequestHandler[]): (target: any, propertyKey: string, descriptor: PropertyDescriptor) => void;
