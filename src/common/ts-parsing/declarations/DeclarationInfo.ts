import { Declaration } from './Declaration';
import { Serializable } from 'ts-json-serializer';

/**
 * Class that defines information about a declaration.
 * Contains the declaration and the origin of the declaration.
 * 
 * @export
 * @class DeclarationInfo
 */
@Serializable({ factory: json => new DeclarationInfo(json.declaration, json.from) })
export class DeclarationInfo {
    constructor(public declaration: Declaration, public from: string) { }
}
