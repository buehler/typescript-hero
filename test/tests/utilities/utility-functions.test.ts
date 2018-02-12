import { getImportInsertPosition } from '../../../src/utilities/utility-functions';
import { expect } from '../setup';

describe('getImportInsertPosition()', () => {

  class MockDocument {
    constructor(private documentText: string) { }

    public getText(): string {
      return this.documentText;
    }
  }

  it('should return top position if no editor is specified', () => {
    const pos = getImportInsertPosition(undefined);
    expect(pos).to.matchSnapshot();
  });

  it('should return the top position if empty file', () => {
    const pos = getImportInsertPosition({
      document: new MockDocument(''),
    } as any);
    expect(pos).to.matchSnapshot();
  });

  it('should return correct position for commented file', () => {
    const pos = getImportInsertPosition({
      document: new MockDocument('    // This is a file header\nStart of file\n'),
    } as any);
    expect(pos).to.matchSnapshot();
  });

  it('should return correct position for use strict', () => {
    const pos = getImportInsertPosition({
      document: new MockDocument(`'use strict'\nStart of file\n`),
    } as any);
    expect(pos).to.matchSnapshot();
  });

  it('should return correct position for jsdoc comment open', () => {
    const pos = getImportInsertPosition({
      document: new MockDocument('/** start of a jsdoc\n'),
    } as any);
    pos.character.should.equal(0);
    pos.line.should.equal(1);
  });

  it('should return correct position for jsdoc comment line', () => {
    const pos = getImportInsertPosition({
      document: new MockDocument(' * jsdoc line\n'),
    } as any);
    expect(pos).to.matchSnapshot();
  });

  it('should return correct position for jsdoc comment close', () => {
    const pos = getImportInsertPosition({
      document: new MockDocument('*/\n'),
    } as any);
    expect(pos).to.matchSnapshot();
  });

});
