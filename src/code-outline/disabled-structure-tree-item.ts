import BaseStructureTreeItem from './base-structure-tree-item';

/**
 * Structure tree item that is used when the feature is disabled via config.
 *
 * @export
 * @class DisabledStructureTreeItem
 * @extends {BaseStructureTreeItem}
 */
export default class DisabledStructureTreeItem extends BaseStructureTreeItem {
  constructor() {
    super('Feature is disabled.');
  }
}
