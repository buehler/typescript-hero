import {TypescriptFile} from '../models/TypescriptFile';
import * as fs from 'fs';
import * as path from 'path';
import {Configuration} from './Configuration';
import {TypescriptSymbol, SymbolType} from '../models/TypescriptSymbol';
import {Logger} from './Logger';
import * as vscode from 'vscode';

const cacheCheck = 'Symbol cache $(check)',
    cacheSyncing = 'Symbol cache $(sync)',
    cacheErr = 'Symbol cache $(flame)';

const errColor = '#CE4543',
    okColor = '#FFF';

// Regex and word lists (thanks to https://github.com/cybertim!)
const reservedWords = ['window', 'dom', 'array', 'from', 'null', 'return', 'get', 'set', 'boolean', 'string', 'if', 'var', 'let', 'const', 'for', 'public', 'class', 'interface', 'new', 'import', 'as', 'private', 'while', 'case', 'switch', 'this', 'function', 'enum'],
    utilityKeywords = ['cancel', 'build', 'finish', 'merge', 'clamp', 'construct', 'native', 'clear', 'update', 'parse', 'sanitize', 'render', 'has', 'equal', 'dispose', 'create', 'as', 'is', 'init', 'process', 'get', 'set'],
    nodeIgnorePaths = ['esm', 'testing', 'test', 'facade', 'backends'],
    matchers = {
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
            let globs = [],
                ignores = [];
            if (vscode.workspace.rootPath && fs.existsSync(path.join(vscode.workspace.rootPath, 'package.json'))) {
                let packageJson = require(path.join(vscode.workspace.rootPath, 'package.json'));
                if (packageJson['dependencies']) {
                    globs = globs.concat(Object.keys(packageJson['dependencies']).map(o => `**/node_modules/${o}/**/*.d.ts`));
                    ignores = ignores.concat(Object.keys(packageJson['dependencies']).map(o => `**/node_modules/${o}/node_modules/**`));
                }
                if (packageJson['devDependencies']) {
                    globs = globs.concat(Object.keys(packageJson['dependencies']).map(o => `**/node_modules/${o}/**/*.d.ts`));
                    ignores = ignores.concat(Object.keys(packageJson['dependencies']).map(o => `**/node_modules/${o}/node_modules/**`));
                }
            } else {
                globs.push('**/node_modules/**/*.d.ts');
            }
            searches.push(vscode.workspace.findFiles(`{${globs.join(',')}}`, ignores.length ? `${ignores.join(',')}` : '', undefined, tokenSource.token));
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

                let tsFiles = files.map(o => new TypescriptFile(o));

                for (let file of tsFiles.filter(o => !o.nodeModule)) {
                    if (file.defintion && file.typings) {
                        symbols.push(...this.processTypingsFile(file));
                    } else if (!(file.defintion || file.typings)) {
                        symbols.push(this.processLocalFile(file));
                    }
                }

                return symbols.concat(this.processNodeModules(tsFiles.filter(o => o.nodeModule)));
            })
            .catch(errors => {
                tokenSource.dispose();
                throw errors;
            });
    }

    private processLocalFile(file: TypescriptFile): TypescriptSymbol {
        let symbol = new TypescriptSymbol(file.path.name, file.path.dir, SymbolType.Local);
        for (let line of file.content) {
            let matches = line.match(matchers.exports);
            if (!matches || !matches.map(o => o ? o.trim() : '').filter(Boolean).length || !this.isValidName(matches[2], line)) {
                continue;
            }
            symbol.exports.push(matches[2]);
        }
        return symbol;
    }

    private processNodeModules(files: TypescriptFile[]): TypescriptSymbol[] {
        let packages: { [id: string]: TypescriptFile[] } = {},
            symbols: TypescriptSymbol[] = [];

        for (let file of files) {
            let pathes = file.path.dir.split(path.sep);
            let packageName = pathes[pathes.indexOf('node_modules') + 1];
            if (!packages[packageName]) {
                packages[packageName] = [];
            }
            packages[packageName].push(file);
        }

        for (let p in packages) {
            let files = packages[p].sort((o1, o2) => o2.pathSegments - o1.pathSegments);
            console.log(1);
        }

        console.log('yay');

        // const tree = _path.dir.split(path.sep);
        // const node = tree.indexOf('node_modules') + 1;
        // for (let i = tree.length; i >= node; i--) {
        //     let constructedPath = '/';
        //     for (let j = 0; j < i; j++) {
        //         constructedPath = constructedPath + tree[j] + '/';
        //     }
        //     let files = fs.readdirSync(constructedPath);
        //     if (files.indexOf('index.d.ts') !== -1) {
        //         let returnPath = '';
        //         for (let j = node; j < i; j++) {
        //             returnPath = returnPath + (returnPath === '' ? '' : '/') + tree[j];
        //         }
        //         return returnPath;
        //     }
        // }
        // return null;

        // // Process node_modules like Angular2 etc.
        // // these libraries contain their own d.ts files with 'export declares'
        // if (validPath) {
        //     let _export: IExport = {
        //         libraryName: constructNodeLibraryName(file.path),
        //         path: file.path.dir,
        //         type: ExportType.NODE,
        //         exported: []
        //     }
        //     for (let k = 0; k < file.lines.length; k++) {
        //         const line = file.lines[k];
        //         const matches = line.match(matchers.node);
        //         if (matches &&
        //             checkIfValid(matches[1], line)) {
        //             _export.exported.push(matches[1]);
        //         }
        //     }
        //     exports.push(_export);
        // }

        return Promise.resolve([]);
    }

    private processTypingsFile(file: TypescriptFile): TypescriptSymbol[] {
        let symbols: TypescriptSymbol[] = [];
        for (let line of file.content) {
            let matches = line.match(matchers.typings);
            if (!matches || !matches.map(o => o.trim()).filter(Boolean).length) {
                continue;
            }
            let symbol = new TypescriptSymbol(matches[1], file.path.dir, SymbolType.Typings);
            if (!symbols.find(o => o.alias === symbol.alias)) {
                symbols.push(symbol);
            }
        }
        return symbols;
    }

    private isValidName(name: string, line: string): boolean {
        let explicitMatch = line.match(matchers.explicitExport);

        return reservedWords.indexOf(name) === -1 &&
            (!!explicitMatch || !utilityKeywords.some(o => name.startsWith(o)));
    }
}
