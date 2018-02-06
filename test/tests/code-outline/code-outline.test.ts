import { expect } from 'chai';
import { ClassDeclaration } from 'typescript-parser';
import { ExtensionContext } from 'vscode';

import DeclarationStructureTreeItem from '../../../src/code-outline/declaration-structure-tree-item';
import ioc from '../../../src/ioc';
import iocSymbols from '../../../src/ioc-symbols';

describe('CodeOutline', () => {

  let context: ExtensionContext;

  before(() => {
    context = ioc.get<ExtensionContext>(iocSymbols.extensionContext);
  });

  it('should create a tree item', () => {
    const declaration = new ClassDeclaration('class', true, 0, 100);
    const item = new DeclarationStructureTreeItem(declaration, context);

    expect(item).to.exist;
  });

});
