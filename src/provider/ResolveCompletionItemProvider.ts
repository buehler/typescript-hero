import {TsResolveSpecifier} from '../models/TsResolveSpecifier';
import {DeclarationInfo, ResolveIndex} from '../caches/ResolveIndex';
import {ExtensionConfig} from '../ExtensionConfig';
import {ModuleDeclaration} from '../models/TsDeclaration';
import {TsExternalModuleImport, TsNamedImport, TsNamespaceImport} from '../models/TsImport';
import {TsFile} from '../models/TsResource';
import {TsResourceParser} from '../parser/TsResourceParser';
import {Logger, LoggerFactory} from '../utilities/Logger';
import {getDeclarationsFilteredByImports} from '../utilities/ResolveIndexExtensions';
import {inject, injectable} from 'inversify';
import {join, normalize, parse, relative} from 'path';
import {CancellationToken, CompletionItem, CompletionItemProvider, Position, TextDocument, TextEdit, workspace} from 'vscode';

@injectable()
export class ResolveCompletionItemProvider implements CompletionItemProvider {
    private logger: Logger;

    constructor( @inject('LoggerFactory') loggerFactory: LoggerFactory,
        private config: ExtensionConfig,
        private index: ResolveIndex,
        private parser: TsResourceParser) {
        this.logger = loggerFactory('ResolveCompletionItemProvider');
        this.logger.info('Instantiated.');
    }

    provideCompletionItems(document: TextDocument, position: Position, token: CancellationToken): Promise<CompletionItem[]> {
        let wordAtPosition = document.getWordRangeAtPosition(position),
            lineText = document.lineAt(position.line).text,
            searchWord = '';

        if (wordAtPosition && wordAtPosition.start.character < position.character) {
            let word = document.getText(wordAtPosition);
            searchWord = word.substr(0, position.character - wordAtPosition.start.character);
        }

        if (!searchWord ||
            token.isCancellationRequested ||
            !this.index.indexReady ||
            searchWord.length < this.config.resolver.minCharactersForCompletion ||
            (lineText.substring(0, position.character).match(/["']/g) || []).length % 2 === 1 ||
            lineText.match(/^\s*(\/\/|\/\*\*|\*\/|\*)/g) ||
            lineText.substring(0, position.character).match(new RegExp(`(\w*[.])+${searchWord}`, 'g'))) {
            return Promise.resolve(null);
        }

        this.logger.info('Search completion for word.', { searchWord });

        return this.parser.parseSource(document.getText())
            .then(parsed => {
                if (token.isCancellationRequested) {
                    return [];
                }
                let declarations = getDeclarationsFilteredByImports(this.index, document.fileName, parsed.imports);
                if (token.isCancellationRequested) {
                    return [];
                }

                let filtered = declarations.filter(o => o.declaration.name.startsWith(searchWord)).map(o => {
                    let item = new CompletionItem(o.declaration.name, o.declaration.getItemKind());
                    item.detail = o.from;
                    item.additionalTextEdits = this.calculateTextEdits(o, document, parsed);
                    return item;
                });

                if (token.isCancellationRequested) {
                    return [];
                }

                return filtered;
            });
    }

    private calculateTextEdits(declaration: DeclarationInfo, document: TextDocument, parsedSource: TsFile): TextEdit[] {
        // TODO: Review / refactor.
        if (parsedSource.imports.some(o => {
            if (o instanceof TsNamespaceImport || o instanceof TsExternalModuleImport) {
                return declaration.from === o.libraryName;
            } else if (o instanceof TsNamedImport) {
                let importedLib = o.libraryName;
                if (importedLib.startsWith('.')) {
                    let parsed = parse(document.fileName);
                    importedLib = '/' + workspace.asRelativePath(normalize(join(parsed.dir, importedLib)));
                }
                return importedLib === declaration.from.replace(/[/]?index$/, '') && o.specifiers.some(s => s.specifier === declaration.declaration.name);
            }
            return false;
        })) {
            return [];
        }

        let imp = parsedSource.imports.find(o => {
            if (o instanceof TsNamedImport) {
                let importedLib = o.libraryName;
                if (importedLib.startsWith('.')) {
                    let parsed = parse(document.fileName);
                    importedLib = '/' + workspace.asRelativePath(normalize(join(parsed.dir, importedLib)));
                }
                return importedLib === declaration.from.replace(/[/]?index$/, '');
            }
            return false;
        });

        if (imp && imp instanceof TsNamedImport) {
            let line = document.getText().split('\n').indexOf(imp.toImport(this.config.resolver.importOptions).replace('\n', ''));
            if (line < 0) {
                return [];
            }
            imp.specifiers.push(new TsResolveSpecifier(declaration.declaration.name));
            return [
                TextEdit.delete(document.lineAt(line).range),
                TextEdit.insert(new Position(line, 0), imp.toImport(this.config.resolver.importOptions).replace('\n', ''))
            ];
        } else {
            if (declaration.declaration instanceof ModuleDeclaration) {
                let mod = new TsNamespaceImport(declaration.declaration.name, declaration.from);
                return [
                    TextEdit.insert(new Position(0, 0), mod.toImport(this.config.resolver.importOptions))
                ];
            } else {
                let library = declaration.from;
                if (declaration.from.startsWith('/')) {
                    let activeFile = parse('/' + workspace.asRelativePath(document.fileName)).dir;
                    let relativePath = relative(activeFile, declaration.from).replace(/[/]?index$/, '');
                    if (!relativePath.startsWith('.')) {
                        relativePath = './' + relativePath;
                    }
                    relativePath = relativePath.replace(/\\/g, '/');
                    library = relativePath;
                }
                let named = new TsNamedImport(library);
                named.specifiers.push(new TsResolveSpecifier(declaration.declaration.name));
                return [
                    TextEdit.insert(new Position(0, 0), named.toImport(this.config.resolver.importOptions))
                ];
            }
        }
    }
}

export const RESOLVE_TRIGGER_CHARACTERS = [
    '_',
    'a',
    'b',
    'c',
    'd',
    'e',
    'f',
    'g',
    'h',
    'i',
    'j',
    'k',
    'l',
    'm',
    'n',
    'o',
    'p',
    'q',
    'r',
    's',
    't',
    'u',
    'v',
    'w',
    'x',
    'y',
    'z',
    'A',
    'B',
    'C',
    'D',
    'E',
    'F',
    'G',
    'H',
    'I',
    'J',
    'K',
    'L',
    'M',
    'N',
    'O',
    'P',
    'Q',
    'R',
    'S',
    'T',
    'U',
    'V',
    'W',
    'X',
    'Y',
    'Z'
];
