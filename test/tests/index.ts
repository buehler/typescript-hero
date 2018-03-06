// PLEASE DO NOT MODIFY / DELETE UNLESS YOU KNOW WHAT YOU ARE DOING
//
// This file is providing the test runner to use when running extension tests.
// By default the test runner in use is Mocha based.
//
// You can provide your own test runner if you want to override it by exporting
// a function run(testRoot: string, clb: (error:Error) => void) that the extension
// host can call to run the tests. The test runner is expected to use console.log
// to report the results back to the caller. When the tests are finished, return
// a possible error to the callback or null if none.
import { ensureFileSync, readFileSync, writeFileSync } from 'fs-extra';
import * as glob from 'glob';
import { hook, Instrumenter, Reporter } from 'istanbul';
import { join, relative } from 'path';
import { ExtensionContext, Memento } from 'vscode';

const remapIstanbul = require('remap-istanbul');

type MatcherFunction = ((file: string) => boolean) & { files?: string[] };
type Transformer = (code: string, filename: string) => string;

class ContextMock implements ExtensionContext {
  subscriptions: { dispose(): any }[] = [];
  workspaceState: Memento;
  globalState: Memento;
  extensionPath: string = '';
  storagePath: string = '';
  asAbsolutePath(path: string): string {
    return relative(global['rootPath'], path);
  }
}

// Prepare for snapshot (sigh) tests.
// HACK
global['rootPath'] = join(__dirname, '..', '..', '..');
// END HACK

const testRunner = require('vscode/lib/testrunner');

// You can directly control Mocha options by uncommenting the following lines
// See https://github.com/mochajs/mocha/wiki/Using-mocha-programmatically#set-options for more info
const options: any = {
  ui: 'bdd',
  useColors: true,
  timeout: 5000,
};

if (process.env.EXT_DEBUG) {
  options.timeout = 2 * 60 * 60 * 1000;
}

testRunner.configure(options);

const originalRun = testRunner.run;

function reportCoverage(
  coverageVariable: string,
  matchFunction: MatcherFunction,
  instrumenter: Instrumenter,
  transformer: Transformer,
): void {
  (hook as any).unhookRequire();

  if (typeof global[coverageVariable] === 'undefined' || Object.keys(global[coverageVariable]).length === 0) {
    console.error('No coverage information was collected, exit without writing coverage information');
    return;
  }
  const coverage = global[coverageVariable];

  for (const file of (matchFunction.files || [])) {
    if (coverage[file]) {
      continue;
    }
    transformer(readFileSync(file, 'utf-8'), file);

    for (const key of Object.keys((instrumenter as any).coverState.s)) {
      (instrumenter as any).coverState.s[key] = 0;
    }

    coverage[file] = (instrumenter as any).coverState;
  }

  const coverageDir = join(process.cwd(), 'coverage');
  const coverageFile = join(coverageDir, 'coverage.json');

  ensureFileSync(coverageFile);
  writeFileSync(coverageFile, JSON.stringify(coverage), 'utf8');

  const remappedCollector = remapIstanbul.remap(coverage, {
    warn: () => { },
  });

  const reporter = new Reporter(undefined, coverageDir);
  reporter.add('lcov');
  reporter.write(remappedCollector, true, () => {
    console.log(`reports written to ${coverageDir}`);
  });
}

testRunner.run = (testRoot: string, callback: (error: Error | null) => void) => {
  if (process.env.CI || process.env.COVERAGE) {
    const coverageVariable = `$$cov_${new Date().getTime()}$$`;
    const sourceRoot = join(testRoot, '../../src');
    const sourceFiles = glob.sync('**/**.js', { cwd: sourceRoot, ignore: ['ioc*.js'] });
    const fileMap = {};
    const instrumenter = new Instrumenter({ coverageVariable });

    for (const file of sourceFiles) {
      const fullPath = join(sourceRoot, file);
      fileMap[fullPath] = true;
      const decache = require('decache');
      decache(fullPath);
    }

    const matchFunction: MatcherFunction = file => fileMap[file];
    matchFunction.files = Object.keys(fileMap);

    const hookOpts = { verbose: false, extensions: ['.js'] };
    const transformer = instrumenter.instrumentSync.bind(instrumenter);
    (hook as any).hookRequire(matchFunction, transformer, hookOpts);

    global[coverageVariable] = {};

    process.on('exit', () => {
      reportCoverage(
        coverageVariable,
        matchFunction,
        instrumenter,
        transformer,
      );
    });
  }

  const { default: ioc } = require('../../src/ioc');
  const { default: iocSymbols } = require('../../src/ioc-symbols');
  ioc.bind(iocSymbols.extensionContext).toConstantValue(new ContextMock());

  originalRun(testRoot, callback);
};

module.exports = testRunner;
