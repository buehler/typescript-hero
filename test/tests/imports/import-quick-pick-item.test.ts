import { ClassDeclaration } from 'typescript-parser';

import ImportQuickPickItem from '../../../src/imports/import-quick-pick-item';
import { expect } from '../setup';

describe('ImportQuickPickItem', () => {

  it('should set the correct fields', () => {
    const item = new ImportQuickPickItem({
      declaration: new ClassDeclaration('class', true),
      from: '/server/indices',
    });

    expect(item).to.matchSnapshot();
  });

  it('should contain the declaration info', () => {
    const item = new ImportQuickPickItem({
      declaration: new ClassDeclaration('class', true),
      from: '/server/indices',
    });

    expect(item.declarationInfo).to.matchSnapshot();
  });

});
