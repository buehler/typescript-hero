import { DeclarationInfo } from '../ts-parsing/declarations';
import { Serializable } from 'ts-json-serializer';

/**
 * Defines a decision for a declaration that has to be made by the user.
 * Is used by the import manager when importing all missing imports.
 * 
 * @export
 * @class ImportUserDecision
 */
@Serializable({ factory: json => new DeclarationIndexPartial(json.index, json.infos) })
export class DeclarationIndexPartial {
    constructor(public index: string, public infos: DeclarationInfo[]) { }
}
