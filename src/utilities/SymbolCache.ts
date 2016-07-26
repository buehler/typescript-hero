import {TypescriptFile} from '../models/TypescriptFile';
import * as fs from 'fs';
import * as path from 'path';
import {Configuration} from './Configuration';
import {TypescriptSymbol} from '../models/TypescriptSymbol';
import {Logger} from './Logger';
import * as vscode from 'vscode';

const cacheCheck = 'Symbol cache $(check)',
    cacheSyncing = 'Symbol cache $(sync)',
    cacheErr = 'Symbol cache $(flame)';

const errColor = '#CE4543',
    okColor = '#FFF';

// Regex and word lists (thanks to https://github.com/cybertim!)
const reservedWords: string[] = ['window', 'dom', 'array', 'from', 'null', 'return', 'get', 'set', 'boolean', 'string', 'if', 'var', 'let', 'const', 'for', 'public', 'class', 'interface', 'new', 'import', 'as', 'private', 'while', 'case', 'switch', 'this', 'function', 'enum'];
const utilityKeywords: string[] = ['cancel', 'build', 'finish', 'merge', 'clamp', 'construct', 'native', 'clear', 'update', 'parse', 'sanitize', 'render', 'has', 'equal', 'dispose', 'create', 'as', 'is', 'init', 'process', 'get', 'set'];
const matchers = {
    explicitExport: /export(.*)(function|class|type|interface|var|let|const|enum)\s/,
    commonWords: /([.?_:\'\"a-zA-Z0-9]{2,})/g,
    exports: /export[\s]+[\s]?[\=]?[\s]?(function|class|type|interface|var|let|const|enum|[\s]+)*([a-zA-Z_$][0-9a-zA-Z_$]*)[\:|\(|\s|\;\<]/,
    imports: /import[\s]+[\*\{]*[\s]*([a-zA-Z\_\,\s]*)[\s]*[\}]*[\s]*from[\s]*[\'\"]([\S]*)[\'|\"]+/,
    node: /export[\s]+declare[\s]+[a-zA-Z]+[\s]+([a-zA-Z_$][0-9a-zA-Z_$]*)[\:]?[\s]?/,
    typings: /declare[\s]+module[\s]+[\"|\']+([\S]*)[\"|\']+/
};

export class SymbolCache {
    private static _instance: SymbolCache = new SymbolCache();
    private statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
    private synching: boolean;
    private _symbolCache: TypescriptSymbol[];

    public static get instance(): SymbolCache {
        return SymbolCache._instance;
    }

    public get symbolCache(): TypescriptSymbol[] {
        return this._symbolCache;
    }

    public get cacheBuilt(): boolean {
        return !!this._symbolCache;
    }

    constructor() {
        if (SymbolCache._instance) {
            throw new TypeError('SymbolCache cannot be instantiated');
        }
        this.statusBarItem.text = cacheSyncing;
        this.statusBarItem.tooltip = 'Click to manually resync the symbols.';
        this.statusBarItem.command = 'typescriptHero.refreshSymbolCache';
        this.statusBarItem.show();

        vscode.workspace.onDidSaveTextDocument(event => {
            this.refreshCache();
        });
    }

    public refreshCache(): void {
        if (!this.synching) {
            Logger.instance.log('Start refreshing of symbol cache.');
            this.synching = true;
            this.statusBarItem.text = cacheSyncing;

            this.analyzeSymbols()
                .then(symbols => {
                    Logger.instance.log(`Cache refresh successfull. Found ${symbols.length} symbols.`);
                    this._symbolCache = symbols;
                    return true;
                })
                .catch(err => {
                    Logger.instance.error('An error happend during cache refresh', err);
                    return false;
                })
                .then(success => {
                    this.synching = false;
                    this.statusBarItem.color = success ? okColor : errColor;
                    this.statusBarItem.text = success ? cacheCheck : cacheErr;
                });
        }
    }

    private analyzeSymbols(): Promise<TypescriptSymbol[]> {
        let tokenSource = new vscode.CancellationTokenSource();
        let searches = [vscode.workspace.findFiles('**/*.ts', '{**/node_modules/**,**/typings/**}', undefined, tokenSource.token)];

        if (Configuration.includeNodeModules) {
            let globs = [];
            if (vscode.workspace.rootPath && fs.existsSync(path.join(vscode.workspace.rootPath, 'package.json'))) {
                let packageJson = require(path.join(vscode.workspace.rootPath, 'package.json'));
                if (packageJson['dependencies']) {
                    globs = globs.concat(Object.keys(packageJson['dependencies']).map(o => `**/node_modules/${o}/**/*.d.ts`));
                }
                if (packageJson['devDependencies']) {
                    globs = globs.concat(Object.keys(packageJson['dependencies']).map(o => `**/node_modules/${o}/**/*.d.ts`));
                }
            } else {
                globs.push('**/node_modules/**/*.d.ts');
            }
            searches.push(vscode.workspace.findFiles(`{${globs.join(',')}}`, '', undefined, tokenSource.token));
        }

        if (Configuration.includeTypings) {
            searches.push(vscode.workspace.findFiles('**/typings/**/*.ts', '', undefined, tokenSource.token));
        }

        return Promise
            .all(searches)
            .then(uris => {
                tokenSource.dispose();
                let symbols: TypescriptSymbol[] = [];
                let files: vscode.Uri[] = uris.reduce((all, element) => all.concat(element), []);

                for (let uri of files) {
                    let file = new TypescriptFile(uri);

                    if (file.defintion && file.typings) {
                        symbols.push(this.processTypingsFile(file));
                    } else if (file.defintion && file.nodeModule) {
                        symbols.push(this.processNodeModulesFile(file));
                    } else if (!(file.defintion || file.nodeModule || file.typings)) {
                        symbols.push(this.processLocalFile(file));
                    }
                }

                return symbols;
            })
            .catch(errors => {
                tokenSource.dispose();
                throw errors;
            });
    }

    private processLocalFile(file: TypescriptFile): TypescriptSymbol {
        console.log('local', file)
        return null;
    }

    private processNodeModulesFile(file: TypescriptFile): TypescriptSymbol {
        console.log('node', file)
        return null;
    }

    private processTypingsFile(file: TypescriptFile): TypescriptSymbol {
        console.log('typings', file)
        return null;
    }
}
