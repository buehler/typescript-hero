import {ResolveItem} from './ResolveItem';
import {QuickPickItem} from 'vscode';

export class ResolveQuickPickItem implements QuickPickItem {
    public label: string;
    public description: string;

    constructor(public resolveItem: ResolveItem) {
        this.label = this.resolveItem.alias || this.resolveItem.declaration.name;
        this.description = this.resolveItem.libraryName;
    }
}
