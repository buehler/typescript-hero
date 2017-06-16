import { ExtensionContext, TreeItemCollapsibleState } from 'vscode';

import { Import } from '../../../common/ts-parsing/imports';
import { File } from '../../../common/ts-parsing/resources';
import { BaseStructureTreeItem } from './BaseStructureTreeItem';

/**
 * Structure item that represents an import in a file.
 * 
 * @export
 * @class ImportStructureTreeItem
 * @extends {BaseStructureTreeItem}
 */
export class ImportStructureTreeItem extends BaseStructureTreeItem {
    constructor(tsImport: Import, context: ExtensionContext) {
        super(tsImport.libraryName);
        this.iconPath = context.asAbsolutePath('./src/extension/assets/icons/declarations/import.svg');
        this.command = this.createJumpToCommand([tsImport]);
    }
}

/**
 * Structure item that contains all imports from the file.
 * Collapsed by default.
 * 
 * @export
 * @class ImportsStructureTreeItem
 * @extends {BaseStructureTreeItem}
 */
export class ImportsStructureTreeItem extends BaseStructureTreeItem {
    constructor(private file: File, private context: ExtensionContext) {
        super('Imports');
        this.collapsibleState = TreeItemCollapsibleState.Collapsed;
        this.iconPath = context.asAbsolutePath('./src/extension/assets/icons/declarations/module.svg');
    }

    public getChildren(): BaseStructureTreeItem[] {
        return this.file.imports.map(i => new ImportStructureTreeItem(i, this.context));
    }
}
