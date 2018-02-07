import { expect } from 'chai';

import DisabledStructureTreeItem from '../../../src/code-outline/disabled-structure-tree-item';

describe('DisabledStructureTreeItem', () => {

  it('should create a tree item', () => {
    const item = new DisabledStructureTreeItem();

    expect(item).to.exist;
  });

  it('should return disabled text', () => {
    const item = new DisabledStructureTreeItem();

    expect(item.label).to.equal('Feature is disabled.');
  });

});
