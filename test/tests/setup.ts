import { expect as chaiExpect, use } from 'chai';
import { EOL } from 'os';
import { join, parse } from 'path';
import sinonChai = require('sinon-chai');
import { DeclarationIndex } from 'typescript-parser';
import { TextDocument } from 'vscode';

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

export function getDocumentText(document: TextDocument, lineFrom: number, lineTo: number): string {
  const lines: string[] = [];
  for (let line = lineFrom; line <= lineTo; line++) {
    lines.push(document.lineAt(line).text);
  }
  return lines.join(EOL) + EOL;
}

export function waitForIndexReady(index: DeclarationIndex): Promise<void> {
  return new Promise((resolve) => {
    if (index.indexReady) {
      resolve();
    }

    const interval = setInterval(
      () => {
        if (index.indexReady) {
          clearInterval(interval);
          resolve();
        }
      },
      50,
    );
  });
}
