import { Export } from './Export';
import { Serializable } from 'ts-json-serializer';

/**
 * Declares an all export (i.e. export * from ...).
 * 
 * @export
 * @class AllExport
 * @implements {Export}
 */
@Serializable({ factory: json => new AllExport(json.start, json.end, json.from) })
export class AllExport implements Export {
    constructor(public start: number, public end: number, public from: string) { }
}
