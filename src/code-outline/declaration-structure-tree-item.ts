import {
  ClassDeclaration,
  Declaration,
  FunctionDeclaration,
  GetterDeclaration,
  InterfaceDeclaration,
  MethodDeclaration,
  PropertyDeclaration,
  SetterDeclaration,
  VariableDeclaration,
} from 'typescript-parser';
import { stringTemplate } from 'typescript-parser/utilities/StringTemplate';
import { CompletionItemKind, ExtensionContext, TreeItemCollapsibleState } from 'vscode';

import { getItemKind } from '../utilities/utility-functions';
import BaseStructureTreeItem from './base-structure-tree-item';

const fileTemplate = stringTemplate`./src/assets/icons/declarations/${0}.svg`;

/**
 * Function to calculate the displayed name of the declaration structure item.
 *
 * @param {Declaration} declaration
 * @returns {string}
 */
function getDeclarationLabel(declaration: Declaration): string {
  if (
    declaration instanceof FunctionDeclaration ||
    declaration instanceof MethodDeclaration
  ) {
    const params = declaration.parameters.map(p => p.name + (p.type ? `: ${p.type}` : '')).join(', ');
    return `${declaration.name}(${params})${declaration.type ? `: ${declaration.type}` : ''}`;
  }

  if (declaration instanceof PropertyDeclaration) {
    return declaration.name + (declaration.type ? `: ${declaration.type}` : '');
  }

  if (
    declaration instanceof ClassDeclaration ||
    declaration instanceof InterfaceDeclaration
  ) {
    return declaration.name + (declaration.typeParameters ? `<${declaration.typeParameters.join(', ')}>` : '');
  }

  if (
    declaration instanceof GetterDeclaration ||
    declaration instanceof SetterDeclaration
  ) {
    return `${declaration instanceof GetterDeclaration ? 'get' : 'set'}() ${declaration.name}` +
      `${declaration.type ? `: ${declaration.type}` : ''}`;
  }

  return declaration.name;
}

/**
 * Structure item that represents a typescript declaration of any way.
 *
 * @export
 * @class DeclarationStructureTreeItem
 * @extends {BaseStructureTreeItem}
 */
export default class DeclarationStructureTreeItem extends BaseStructureTreeItem {
  public get iconPath(): string | undefined {
    switch (getItemKind(this.declaration)) {
      case CompletionItemKind.Class:
      case CompletionItemKind.Keyword:
        return this.context.asAbsolutePath(fileTemplate('class'));
      case CompletionItemKind.Interface:
        return this.context.asAbsolutePath(fileTemplate('interface'));
      case CompletionItemKind.Enum:
        return this.context.asAbsolutePath(fileTemplate('enum'));
      case CompletionItemKind.Function:
      case CompletionItemKind.Method:
        return this.context.asAbsolutePath(fileTemplate('callable'));
      case CompletionItemKind.Module:
        return this.context.asAbsolutePath(fileTemplate('module'));
      case CompletionItemKind.Property:
        return this.context.asAbsolutePath(fileTemplate('property'));
      default:
        break;
    }

    if (getItemKind(this.declaration) === CompletionItemKind.Variable) {
      return (this.declaration as VariableDeclaration).isConst ?
        this.context.asAbsolutePath(fileTemplate('const')) :
        this.context.asAbsolutePath(fileTemplate('variable'));
    }

    return this.context.asAbsolutePath(fileTemplate('default'));
  }

  constructor(public declaration: Declaration, private context: ExtensionContext) {
    super(getDeclarationLabel(declaration));

    if (
      declaration instanceof ClassDeclaration ||
      declaration instanceof InterfaceDeclaration
    ) {
      this.collapsibleState = TreeItemCollapsibleState.Collapsed;
    } else {
      this.command = this.command = this.createJumpToCommand([declaration]);
    }
  }

  public getChildren(): BaseStructureTreeItem[] {
    console.log('DIIINI muETER');
    if (
      this.declaration instanceof ClassDeclaration ||
      this.declaration instanceof InterfaceDeclaration
    ) {
      return [
        ...this.declaration.accessors.map(p => new DeclarationStructureTreeItem(p, this.context)),
        ...this.declaration.properties.map(p => new DeclarationStructureTreeItem(p, this.context)),
        ...this.declaration.methods.map(m => new DeclarationStructureTreeItem(m, this.context)),
      ];
    }
    return [];
  }
}

