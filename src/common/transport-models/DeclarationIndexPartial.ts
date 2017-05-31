import { DeclarationInfo } from '../ts-parsing/declarations';
import { Serializable } from 'ts-json-serializer';

/**
 * Defines a partial result for the declaration index. Is used to send the calculated symbol index from the
 * server to the extension ("client") so that the extension is aware of the symbols.
 * 
 * @export
 * @class DeclarationIndexPartial
 */
@Serializable({ factory: json => new DeclarationIndexPartial(json.index, json.infos) })
export class DeclarationIndexPartial {
    constructor(public index: string, public infos: DeclarationInfo[]) { }
}
