import { TreeItem } from 'vscode';

/**
 * Base class for the document structure (code outline) tree items
 * 
 * @export
 * @abstract
 * @class BaseStructureTreeItem
 * @extends {TreeItem}
 */
export abstract class BaseStructureTreeItem extends TreeItem {
    constructor(label: string) {
        super(label);
    }

    /**
     * Returns the children of the current structure tree item (if any)
     * 
     * @returns {BaseStructureTreeItem[]} 
     * 
     * @memberof BaseStructureTreeItem
     */
    public getChildren(): BaseStructureTreeItem[] {
        return [];
    }
}
