import { BaseStructureTreeItem } from './BaseStructureTreeItem';

/**
 * Structure tree item that is used when the feature is disabled via config.
 * 
 * @export
 * @class DisabledStructureTreeItem
 * @extends {BaseStructureTreeItem}
 */
export class DisabledStructureTreeItem extends BaseStructureTreeItem {
    constructor() {
        super('Feature is disabled.');
    }
}
