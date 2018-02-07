import { expect as chaiExpect, use } from 'chai';
import { join, parse } from 'path';

const chaiJestSnapshot = require('chai-jest-snapshot');

declare global {
  namespace Chai {
    interface Assertion {
      matchSnapshot(): Assertion;
    }
  }
}

use(chaiJestSnapshot);

before(() => chaiJestSnapshot.resetSnapshotRegistry());

beforeEach(function (): void {
  const fileFromTestRoot = ((this.currentTest as any).file.replace(/.*out\//, '')).replace(/[.]js$/, '.ts');
  const tsFile = parse(join(global['rootPath'], fileFromTestRoot));
  const snapPath = join(tsFile.dir, '__snapshots__', tsFile.base);
  console.log('snap path before all', snapPath);
  chaiJestSnapshot.configureUsingMochaContext(this);
  chaiJestSnapshot.setFilename(`${snapPath}.snap`);
});

export const expect = chaiExpect;
