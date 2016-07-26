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
    matchers = {
        explicitExport: /export(.*)(function|class|type|interface|var|let|const|enum)\s/,
        exports: /export[\s]+[\s]?[\=]?[\s]?(function|class|type|interface|var|let|const|enum|[\s]+)*([a-zA-Z_$][0-9a-zA-Z_$]*)[\:|\(|\s|\;\<]/,
        node: /export[\s]+declare[\s]+[a-zA-Z]+[\s]+([a-zA-Z_$][0-9a-zA-Z_$]*)[\:]?[\s]?/,
        nodeExportFrom: /export\s\{?([*]|.*?)\}?\sfrom\s['"]\.\/(.*)['"]/,
        typings: /declare[\s]+module[\s]+[\"|\']+([\S]*)[\"|\']+/
    };

export class SymbolCache {
    private statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
    private synching: boolean;
    private _symbolCache: TypescriptSymbol[];

    public get symbolCache(): TypescriptSymbol[] {
        return this._symbolCache;
    }

    public get cacheBuilt(): boolean {
        return !!this._symbolCache;
    }

    constructor() {
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
                    globs = globs.concat(Object.keys(packageJson['devDependencies']).map(o => `**/node_modules/${o}/**/*.d.ts`));
                    ignores = ignores.concat(Object.keys(packageJson['devDependencies']).map(o => `**/node_modules/${o}/node_modules/**`));
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

        // groups all node files by package name
        for (let file of files) {
            let pathes = file.path.dir.split(path.sep);
            let packageName = pathes[pathes.indexOf('node_modules') + 1];
            if (!packages[packageName]) {
                packages[packageName] = [];
            }
            packages[packageName].push(file);
        }

        // process each package
        // read all exports and process "moves" (export * from..; export {..} from) at the end.        
        for (let name in packages) {
            let files = packages[name].sort((o1, o2) => o2.pathSegments - o1.pathSegments),
                fileExports: { [path: string]: string[] } = {},
                exportMoves: { from: string, to: string, exports: string[] }[] = [];

            for (let file of files) {
                let packagePath = path.join(file.path.dir.substring(file.path.dir.indexOf(name) + 1 + name.length), file.path.base.substring(0, file.path.base.indexOf('.')));
                if (!fileExports[packagePath]) {
                    fileExports[packagePath] = [];
                }
                for (let line of file.content) {
                    const matches = line.match(matchers.node),
                        exportFromMatches = line.match(matchers.nodeExportFrom);
                    if (exportFromMatches) {
                        exportMoves.push({
                            to: packagePath,
                            from: exportFromMatches[2],
                            exports: exportFromMatches[1].split(',').map(o => o.trim())
                        });
                    }
                    if (!matches || !matches.map(o => o ? o.trim() : '').filter(Boolean).length || !this.isValidName(matches[1], line)) {
                        continue;
                    }
                    fileExports[packagePath].push(matches[1]);
                }
            }

            for (let move of exportMoves) {
                if (!(fileExports[move.from] && fileExports[move.to])) {
                    continue;
                }
                if (move.exports[0] === '*') {
                    fileExports[move.to].push(...fileExports[move.from]);
                    delete fileExports[move.from];
                } else {
                    for (let moveExport of move.exports){
                        let index = fileExports[move.from].indexOf(moveExport);
                        fileExports[move.to].push(...fileExports[move.from].splice(index, 1));
                        if (!fileExports[move.from].length) {
                            delete fileExports[move.from];
                        }
                    }
                }
            }

            let packageJson = require(path.join(vscode.workspace.rootPath, 'node_modules', name, 'package.json'));
            let replace = packageJson['main'] ? packageJson['main'].substring(0, packageJson['main'].indexOf('.')) : '';
            for (let file in fileExports) {
                let libName = `${name}/${file.replace(replace, '')}`;
                if (libName[libName.length - 1] === '/') {
                    libName = libName.substring(0, libName.length - 1);
                }
                let symbol = new TypescriptSymbol(libName, libName, SymbolType.Node);
                symbol.exports = fileExports[file];
                symbols.push(symbol);
            }
        }

        return symbols;
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
