import { DeclarationInfo } from 'typescript-parser';
import { QuickPickItem } from 'vscode';

/**
 * Quickpick item that contains a symbol resolve information (Declarationinfo)
 * Contains the name and the location where it is imported from.
 * The whole DeclarationInfo is also exposed.
 *
 * @export
 * @class ImportQuickPickItem
 * @implements {QuickPickItem}
 */
export default class ImportQuickPickItem implements QuickPickItem {
  public label: string;
  public description: string;

  constructor(public readonly declarationInfo: DeclarationInfo) {
    this.description = this.declarationInfo.from;
    this.label = this.declarationInfo.declaration.name;
  }
}
