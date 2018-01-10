import BaseStructureTreeItem from './base-structure-tree-item';

/**
 * Structure tree item that is used when a document is not parseable (i.e. not typescript)
 *
 * @export
 * @class NotParseableStructureTreeItem
 * @extends {BaseStructureTreeItem}
 */
export default class NotParseableStructureTreeItem extends BaseStructureTreeItem {
  constructor() {
    super('File not parseable.');
  }
}
