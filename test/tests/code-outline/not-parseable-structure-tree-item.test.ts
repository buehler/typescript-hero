import { expect } from 'chai';

import NotParseableStructureTreeItem from '../../../src/code-outline/not-parseable-structure-tree-item';

describe('NotParseableStructureTreeItem', () => {

  it('should create a tree item', () => {
    const item = new NotParseableStructureTreeItem();

    expect(item).to.exist;
  });

  it('should return disabled text', () => {
    const item = new NotParseableStructureTreeItem();

    expect(item.label).to.equal('File not parseable.');
  });

});
