import { expect } from 'chai';
import {
  ClassDeclaration,
  GetterDeclaration,
  MethodDeclaration,
  PropertyDeclaration,
  VariableDeclaration,
} from 'typescript-parser';
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

    // snapshot(item.iconPath);
  });

  it('should return the correct accessor children', () => {
    const declaration = new ClassDeclaration('class', true, 0, 100);
    declaration.accessors.push(new GetterDeclaration('getter', undefined, undefined, false));
    const item = new DeclarationStructureTreeItem(declaration, context);

    // snapshot(item.getChildren());
  });

  it('should return the correct property children', () => {
    const declaration = new ClassDeclaration('class', true, 0, 100);
    declaration.properties.push(new PropertyDeclaration('property', undefined, undefined));
    const item = new DeclarationStructureTreeItem(declaration, context);

    // snapshotitem.getChildren());
  });

  it('should return the correct method children', () => {
    const declaration = new ClassDeclaration('class', true, 0, 100);
    declaration.methods.push(new MethodDeclaration('method', false, undefined, undefined));
    const item = new DeclarationStructureTreeItem(declaration, context);

    // snapshotitem.getChildren());
  });

  it('should not return children on simple declarations', () => {
    const declaration = new VariableDeclaration('variable', false, true, undefined);
    const item = new DeclarationStructureTreeItem(declaration, context);

    // snapshotitem.getChildren());
  });

});
