import { expect as chaiExpect, use } from 'chai';
import chaiJestSnapshot from 'chai-jest-snapshot';

use(chaiJestSnapshot);

console.log('required');
// tslint:disable-next-line:ter-prefer-arrow-callback
before(function (): void {
  console.log('required before all');
  chaiJestSnapshot.resetSnapshotRegistry();
});

beforeEach(function (): void {
  console.log('required before each');
  chaiJestSnapshot.configureUsingMochaContext(this);
});

export const expect = chaiExpect;
