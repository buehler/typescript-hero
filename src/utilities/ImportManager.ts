import {Logger} from './Logger';
import {Configuration} from './Configuration';
import {SymbolType, TypescriptSymbol} from '../models/TypescriptSymbol';
import {ImportSymbol} from '../models/ImportSymbol';
import {SymbolCache} from './SymbolCache';
import * as vscode from 'vscode';
import * as path from 'path';

const reservedWords = ['window', 'dom', 'array', 'from', 'null', 'return', 'get', 'set', 'boolean', 'string', 'if', 'var', 'let', 'const', 'for', 'public', 'class', 'interface', 'new', 'import', 'as', 'private', 'while', 'case', 'switch', 'this', 'function', 'enum'],
    utilityKeywords = ['cancel', 'build', 'finish', 'merge', 'clamp', 'construct', 'native', 'clear', 'update', 'parse', 'sanitize', 'render', 'has', 'equal', 'dispose', 'create', 'as', 'is', 'init', 'process', 'get', 'set'],
    matchers = {
        imports: /import[\s]+[\*\{]*[\s]*([a-zA-Z\_\,\s]*)[\s]*[\}]*[\s]*from[\s]*[\'\"]([\S]*)[\'|\"]+/,
        types: /([.?_:\'\"a-zA-Z0-9]{2,})/g
    };

class ImportList {
    private imports: { [libName: string]: ImportSymbol[] } = {};

    public static create(editor: vscode.TextEditor, cache: SymbolCache): ImportList {
        let obj = new ImportList(editor, cache);

        let filename = path.parse(editor.document.fileName).name;
        for (let lineNr = 0; lineNr < editor.document.lineCount; lineNr++) {
            let line = editor.document.lineAt(lineNr);
            obj.matchImports(line.text);
            obj.matchTypes(line, filename);
        }

        return obj;
    }

    private static isValidName(name: string): boolean {
        return reservedWords.indexOf(name) === -1 && !utilityKeywords.some(o => name.startsWith(o));
    }

    constructor(private editor: vscode.TextEditor, private cache: SymbolCache) { }

    public addImport(newImport: ImportSymbol): void {
        if (newImport.symbol.type === SymbolType.Typings && this.imports[newImport.symbol.alias]) {
            return;
        }
        if (!this.imports[newImport.symbol.library]) {
            this.imports[newImport.symbol.library] = [newImport];
        } else if (!this.imports[newImport.symbol.library].some(o => o.element === newImport.element)) {
            this.imports[newImport.symbol.library].push(newImport);
        }
    }

    public commit(): void {
        this.editor.edit(builder => {
            let nonImportLine;
            for (let lineNr = 0; lineNr < this.editor.document.lineCount; lineNr++) {
                let line = this.editor.document.lineAt(lineNr);
                if (!line.text.match(matchers.imports)) {
                    nonImportLine = lineNr;
                    break;
                }
            }
            builder.replace(new vscode.Range(new vscode.Position(0, 0), new vscode.Position(nonImportLine, 0)), this.buildImports());
        });
    }

    private matchImports(lineText: string): void {
        let matches = lineText.match(matchers.imports);
        if (!matches) {
            return;
        }
        let libName = path.parse(matches[2]).name;

        let symbol = this.cache.symbolCache.find(o => o.library === libName);;

        if (!symbol) {
            Logger.instance.warn('A symbol was not found in the cache.', { symbol: libName });
            return;
            // TODO: is this needed?
            // symbol = new TypescriptSymbol(libName, '', SymbolType.Typings);
            // this.imports[libName].push(new ImportSymbol(symbol.alias, symbol));
        }

        if (!this.imports[libName]) {
            this.imports[libName] = [];
        }

        if (symbol.type === SymbolType.Typings) {
            this.imports[libName].push(new ImportSymbol(symbol.alias, symbol));
        } else {
            matches[1]
                .split(',')
                .map(o => o.trim())
                .forEach(o => this.imports[libName].push(new ImportSymbol(o, symbol)));
        }
    }

    private matchTypes(line: vscode.TextLine, filename: string): void {
        if (line.isEmptyOrWhitespace || line.text.match(matchers.imports)) {
            return;
        }
        let text = line.text.trim();
        if (text.startsWith('//') || text.startsWith('/*') || text.startsWith('*')) {
            return;
        }
        if (text.indexOf('//') !== -1) {
            text = text.split('//')[0];
        }
        let matches = text.match(matchers.types);
        if (!matches) {
            return;
        }

        for (let word of matches) {
            // only process unquoted words which are not listed in the commonList
            if (word.indexOf(`'`) > -1 || word.indexOf(`"`) > -1 || !ImportList.isValidName(word)) {
                continue;
            }

            let splitted = word.split('.');
            word = splitted[0];

            this.cache.symbolCache
                .filter(o => {
                    return o.library !== filename &&
                        (
                            (o.type === SymbolType.Typings && word === o.alias) ||
                            ((o.type === SymbolType.Local || o.type === SymbolType.Node) && o.exports.indexOf(word) > -1)
                        );
                })
                .forEach(o => {
                    if (o.type === SymbolType.Typings) {
                        if (!this.imports[o.library]) {
                            this.imports[o.library] = [new ImportSymbol(o.alias, o)];
                        }
                    } else {
                        if (this.imports[o.library] && !this.imports[o.library].some(i => i.element === word)) {
                            this.imports[o.library].push(new ImportSymbol(word, o));
                        }
                    }
                });
        }
    }

    private buildImports(): string {
        let imports = '';
        for (let lib in this.imports) {
            let symbols = this.imports[lib],
                libSymbol = symbols[0].symbol;

            if (libSymbol.type === SymbolType.Typings) {
                imports += `import * as ${libSymbol.alias} from ${Configuration.pathStringDelimiter}${libSymbol.library}${Configuration.pathStringDelimiter};\n`;
            } else if (libSymbol.type === SymbolType.Node) {
                imports += `import {${symbols.map(o => o.element).join(', ')}} from ${Configuration.pathStringDelimiter}${libSymbol.library}${Configuration.pathStringDelimiter};\n`;
            } else {
                let importPath = './' + path.relative(path.parse(this.editor.document.fileName).dir, `${libSymbol.path}/${libSymbol.library}`);
                imports += `import {${symbols.map(o => o.element).join(', ')}} from ${Configuration.pathStringDelimiter}${importPath}${Configuration.pathStringDelimiter};\n`;
            }
        }
        return imports;
    }
}

export class ImportManager {
    constructor(private cache: SymbolCache) { }

    public organizeImports(item?: ImportSymbol): void {
        let list = ImportList.create(vscode.window.activeTextEditor, this.cache);
        if (item) {
            list.addImport(item);
        }
        list.commit();
    }

    public addImport(item: ImportSymbol): void {
        this.organizeImports(item);
    }
}
