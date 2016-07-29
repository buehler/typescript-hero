import {TsDeclaration} from './TsDeclaration';
import {TsResolveFile} from './TsResolveFile';

export class ResolveItem {
    constructor(public declaration: TsDeclaration, public resolveFile: TsResolveFile) { }
}