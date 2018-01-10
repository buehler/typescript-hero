import { BaseStructureTreeItem } from './BaseStructureTreeItem';

/**
 * Structure tree item that is used when a document is not parseable (i.e. not typescript)
 * 
 * @export
 * @class NotParseableStructureTreeItem
 * @extends {BaseStructureTreeItem}
 */
export class NotParseableStructureTreeItem extends BaseStructureTreeItem {
    constructor() {
        super('File not parseable.');
    }
}
