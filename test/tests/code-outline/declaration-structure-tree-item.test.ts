import { expect } from 'chai';
import * as snapshot from 'snap-shot-it';
import { ClassDeclaration } from 'typescript-parser';
import { ExtensionContext } from 'vscode';

import DeclarationStructureTreeItem from '../../../src/code-outline/declaration-structure-tree-item';
import ioc from '../../../src/ioc';
import iocSymbols from '../../../src/ioc-symbols';

describe('DeclarationStructureTreeItem', () => {

  let context: ExtensionContext;

  before(() => {
    context = ioc.get<ExtensionContext>(iocSymbols.extensionContext);
  });

  it('should create a tree item', () => {
    const declaration = new ClassDeclaration('class', true, 0, 100);
    const item = new DeclarationStructureTreeItem(declaration, context);

    expect(item).to.exist;
  });

  it('should return the correct icon path', () => {
    const declaration = new ClassDeclaration('class', true, 0, 100);
    const item = new DeclarationStructureTreeItem(declaration, context);

    snapshot(item.iconPath);
  });

});
