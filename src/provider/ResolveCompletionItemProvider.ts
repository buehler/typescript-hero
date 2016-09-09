import {TsResourceParser} from '../parser/TsResourceParser';
import {ResolveIndex} from '../caches/ResolveIndex';
import {ExtensionConfig} from '../ExtensionConfig';
import {Logger, LoggerFactory} from '../utilities/Logger';
import {inject, injectable} from 'inversify';
import {CancellationToken, CompletionItem, CompletionItemProvider, Position, TextDocument} from 'vscode';

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

        return Promise.resolve()
            .then(() => {
                if (token.isCancellationRequested) {
                    return [];
                }
                let items = this.itemFactory.getResolvableItems(this.index.cachedFiles, document.uri);
                if (token.isCancellationRequested) {
                    return [];
                }

                let filtered = items.filter(o => o.declaration.name.startsWith(searchWord)).map(o => {
                    let item = new CompletionItem(o.alias || o.declaration.name);
                    item.detail = o.libraryName;
                    item.kind = o.declaration.getItemKind();
                    return item;
                });

                if (token.isCancellationRequested) {
                    return [];
                }

                return filtered;
            });
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
