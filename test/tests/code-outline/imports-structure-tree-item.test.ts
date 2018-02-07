import { ExternalModuleImport, File, NamedImport, NamespaceImport, StringImport, SymbolSpecifier } from 'typescript-parser';
import { ExtensionContext } from 'vscode';

import { ImportsStructureTreeItem, ImportStructureTreeItem } from '../../../src/code-outline/imports-structure-tree-item';
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

describe('ImportsStructureTreeItem', () => {

  let context: ExtensionContext;

  before(() => {
    context = ioc.get<ExtensionContext>(iocSymbols.extensionContext);
  });

  it('should create a tree item', () => {
    const resource = new File('./path', '/root', 0, 100);
    resource.imports.push(new NamedImport('lib', 0, 1));
    const item = new ImportsStructureTreeItem(resource, context);

    expect(item).to.exist;
  });

  it('should return the children for the imports', () => {
    const resource = new File('./path', '/root', 0, 100);
    resource.imports.push(new NamedImport('lib', 0, 1));
    const item = new ImportsStructureTreeItem(resource, context);

    expect(item.getChildren().map(c => ({ label: c.label, ctor: c.constructor.name }))).to.matchSnapshot();
  });

});

describe('ImportStructureTreeItem', () => {

  let context: ExtensionContext;

  before(() => {
    context = ioc.get<ExtensionContext>(iocSymbols.extensionContext);
  });

  it('should create a tree item', () => {
    const item = new ImportStructureTreeItem(new NamedImport('lib', 0, 1), context);

    expect(item).to.exist;
  });

  const specImport = new NamedImport('named-spec-imp', 0, 1);
  specImport.defaultAlias = 'default';
  specImport.specifiers.push(new SymbolSpecifier('spec'));
  const imports = [
    new NamedImport('named-imp', 0, 1),
    new StringImport('str-imp'),
    new ExternalModuleImport('ext-imp', 'extImp', 0, 1),
    new NamespaceImport('namespace-imp', 'namespace', 0, 1),
    specImport,
  ];

  for (const test of imports) {
    it(`should return the correct children for the "${test.constructor.name}" import`, () => {
      const item = new ImportStructureTreeItem(test, context);

      expect(item.getChildren().map(c => ({ label: c.label, ctor: c.constructor.name }))).to.matchSnapshot();
    });
  }

});
