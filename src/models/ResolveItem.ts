import {TsDeclaration} from './TsOldDeclaration';
import {TsResolveFile} from './TsResolveFile';

export class ResolveItem {
    constructor(public declaration: TsDeclaration, public libraryName: string, public resolveFile: TsResolveFile, public alias?: string) { }
}
