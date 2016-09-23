import {DeclarationInfo} from '../caches/ResolveIndex';
import {TshCommand} from './TshCommand';
import {QuickPickItem} from 'vscode';

export class CommandQuickPickItem implements QuickPickItem {
    constructor(public label: string, public description: string, public detail: string, public command: TshCommand) { }
}

export class ResolveQuickPickItem implements QuickPickItem {
    public label: string;
    public description: string;

    constructor(public declarationInfo: DeclarationInfo) {
        this.description = this.declarationInfo.from;
        this.label = this.declarationInfo.declaration.name;
    }
}
