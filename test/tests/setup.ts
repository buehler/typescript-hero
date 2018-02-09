import { expect as chaiExpect, use } from 'chai';
import { join, parse } from 'path';
import sinonChai = require('sinon-chai');

const chaiJestSnapshot = require('chai-jest-snapshot');

declare global {
  namespace Chai {
    interface Assertion {
      matchSnapshot(): Assertion;
    }
  }
}

use(chaiJestSnapshot);
use(sinonChai);

before(() => {
  chaiJestSnapshot.resetSnapshotRegistry();
});

beforeEach(function (): void {
  const fileFromTestRoot = ((this.currentTest as any).file.replace(/.*out[\\/]/, '')).replace(/\.js$/, '.ts');
  const tsFile = parse(join(global['rootPath'], fileFromTestRoot));
  const snapPath = join(tsFile.dir, '__snapshots__', tsFile.base);
  chaiJestSnapshot.configureUsingMochaContext(this);
  chaiJestSnapshot.setFilename(`${snapPath}.snap`);
});

export const expect = chaiExpect;

export function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(() => resolve(), ms));
}
