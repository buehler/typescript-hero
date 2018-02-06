import { expect } from 'chai';
import { ExternalModuleImport, File, NamedImport, NamespaceImport, StringImport, SymbolSpecifier } from 'typescript-parser';
import { ExtensionContext } from 'vscode';

import { ImportsStructureTreeItem, ImportStructureTreeItem } from '../../../src/code-outline/imports-structure-tree-item';
import ioc from '../../../src/ioc';
import iocSymbols from '../../../src/ioc-symbols';

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

    // snapshotitem.getChildren());
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

  it('should return the correct children for the imports', () => {
    const testFn = (imp) => {
      const item = new ImportStructureTreeItem(imp, context);
      return item.getChildren();
    };

    const namedImp = new NamedImport('named-imp', 0, 1);
    const stringImp = new StringImport('str-imp');
    const extImp = new ExternalModuleImport('ext-imp', 'extImp', 0, 1);
    const namespaceImp = new NamespaceImport('namespace-imp', 'namespace', 0, 1);
    const specImp = new NamedImport('named-spec-imp', 0, 1);
    specImp.defaultAlias = 'default';
    specImp.specifiers.push(new SymbolSpecifier('spec'));

    // snapshottestFn, namedImp, stringImp, extImp, namespaceImp, specImp);
  });

});
