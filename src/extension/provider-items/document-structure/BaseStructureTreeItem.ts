import { TreeItem, Command } from 'vscode';

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

    /**
     * Creates a command with the given arguments.
     * 
     * @protected
     * @param {any[]} args 
     * @returns {Command} 
     * 
     * @memberof BaseStructureTreeItem
     */
    protected createJumpToCommand(args: any[]): Command {
        return {
            arguments: args,
            title: 'Jump to node',
            command: 'typescriptHero.documentCodeOutline.gotoNode',
        };
    }
}
