import { ExtensionContext, TreeItemCollapsibleState } from 'vscode';

import { Resource } from '../../../common/ts-parsing/resources';
import { BaseStructureTreeItem } from './BaseStructureTreeItem';
import { DeclarationStructureTreeItem } from './DeclarationStructureTreeItem';
import { ImportsStructureTreeItem } from './ImportsStructureTreeItem';

/**
 * Structure item that represents an additional resource in a file (namespace etc).
 * 
 * @export
 * @class ResourceStructureTreeItem
 * @extends {BaseStructureTreeItem}
 */
export class ResourceStructureTreeItem extends BaseStructureTreeItem {
    constructor(public resource: Resource, private context: ExtensionContext) {
        super(resource.identifier);
        this.collapsibleState = TreeItemCollapsibleState.Collapsed;
        this.iconPath = this.context.asAbsolutePath('./src/extension/assets/icons/declarations/module.svg');
    }

    public getChildren(): BaseStructureTreeItem[] {
        const items: BaseStructureTreeItem[] = [];
        if (this.resource.imports && this.resource.imports.length) {
            items.push(new ImportsStructureTreeItem(this.resource, this.context));
        }
        items.push(...this.resource.resources.map(r => new ResourceStructureTreeItem(r, this.context)));
        items.push(...this.resource.declarations.map(d => new DeclarationStructureTreeItem(d, this.context)));
        return items;
    }
}
