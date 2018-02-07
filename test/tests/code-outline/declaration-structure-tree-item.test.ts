import { relative } from 'path';
import {
  ClassDeclaration,
  EnumDeclaration,
  FunctionDeclaration,
  GetterDeclaration,
  InterfaceDeclaration,
  MethodDeclaration,
  ModuleDeclaration,
  PropertyDeclaration,
  TypeAliasDeclaration,
  VariableDeclaration,
} from 'typescript-parser';
import { ExtensionContext } from 'vscode';

import DeclarationStructureTreeItem from '../../../src/code-outline/declaration-structure-tree-item';
import ioc from '../../../src/ioc';
import iocSymbols from '../../../src/ioc-symbols';
import { expect } from '../setup';

declare global {
  namespace Chai {
    interface Assertion {
      matchSnapshot(): Assertion;
    }
  }
}

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

  const iconPossibilities = [
    {
      name: 'class',
      declaration: new ClassDeclaration('class', true, 0, 100),
    },
    {
      name: 'interface',
      declaration: new InterfaceDeclaration('interface', true, 0, 100),
    },
    {
      name: 'enum',
      declaration: new EnumDeclaration('enum', true, 0, 100),
    },
    {
      name: 'function',
      declaration: new FunctionDeclaration('function', true, 'void', 0, 100),
    },
    {
      name: 'method',
      declaration: new MethodDeclaration('method', false, undefined, 'void', 0, 100),
    },
    {
      name: 'module',
      declaration: new ModuleDeclaration('module', 0, 100),
    },
    {
      name: 'property',
      declaration: new PropertyDeclaration('property', undefined, 'void', 0, 100),
    },
    {
      name: 'variable',
      declaration: new VariableDeclaration('variable', false, true, 'string', 0, 100),
    },
    {
      name: 'const',
      declaration: new VariableDeclaration('const', true, true, 'string', 0, 100),
    },
    {
      name: 'default',
      declaration: new TypeAliasDeclaration('typealias', true, 0, 100),
    },
  ];

  for (const test of iconPossibilities) {
    it(`should return the correct icon path for itemKind "${test.name}"`, () => {
      const item = new DeclarationStructureTreeItem(test.declaration, context);

      const path = relative(global['rootPath'], item.iconPath || '');
      expect(path).to.matchSnapshot();
    });
  }

  it('should return the correct accessor children', () => {
    const declaration = new ClassDeclaration('class', true, 0, 100);
    declaration.accessors.push(new GetterDeclaration('getter', undefined, undefined, false));
    const item = new DeclarationStructureTreeItem(declaration, context);

    expect(item.getChildren().map(c => ({ label: c.label, ctor: c.constructor.name }))).to.matchSnapshot();
  });

  it('should return the correct property children', () => {
    const declaration = new ClassDeclaration('class', true, 0, 100);
    declaration.properties.push(new PropertyDeclaration('property', undefined, undefined));
    const item = new DeclarationStructureTreeItem(declaration, context);

    expect(item.getChildren().map(c => ({ label: c.label, ctor: c.constructor.name }))).to.matchSnapshot();
  });

  it('should return the correct method children', () => {
    const declaration = new ClassDeclaration('class', true, 0, 100);
    declaration.methods.push(new MethodDeclaration('method', false, undefined, undefined));
    const item = new DeclarationStructureTreeItem(declaration, context);

    expect(item.getChildren().map(c => ({ label: c.label, ctor: c.constructor.name }))).to.matchSnapshot();
  });

  it('should not return children on simple declarations', () => {
    const declaration = new VariableDeclaration('variable', false, true, undefined);
    const item = new DeclarationStructureTreeItem(declaration, context);

    expect(item.getChildren()).to.matchSnapshot();
  });

});
