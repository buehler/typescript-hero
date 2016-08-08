import {ResolveCache} from '../caches/ResolveCache';
import {ExtensionConfig} from '../ExtensionConfig';
import {ResolveItemFactory} from '../factories/ResolveItemFactory';
import {Logger, LoggerFactory} from '../utilities/Logger';
import {inject, injectable} from 'inversify';
import {CancellationToken, CompletionItem, CompletionItemProvider, Position, TextDocument} from 'vscode';

@injectable()
export class ResolveCompletionItemProvider implements CompletionItemProvider {
    private logger: Logger;

    constructor( @inject('LoggerFactory') loggerFactory: LoggerFactory,
        private config: ExtensionConfig,
        private cache: ResolveCache,
        private itemFactory: ResolveItemFactory) {
        this.logger = loggerFactory('ResolveCompletionItemProvider');
        this.logger.info('Instantiated.');
    }

    provideCompletionItems(document: TextDocument, position: Position, token: CancellationToken): Promise<CompletionItem[]> {
        let wordAtPosition = document.getWordRangeAtPosition(position);
        let searchWord = '';
        if (wordAtPosition && wordAtPosition.start.character < position.character) {
            let word = document.getText(wordAtPosition);
            searchWord = word.substr(0, position.character - wordAtPosition.start.character);
        }

        if (token.isCancellationRequested || !this.cache.cacheReady || searchWord.length < this.config.resolver.minCharactersForCompletion) {
            return Promise.resolve([]);
        }

        this.logger.info('Search completion for word.', { searchWord });

        return new Promise((resolve, reject) => {
            if (token.isCancellationRequested) {
                return resolve([]);
            }
            let items = this.itemFactory.getResolvableItems(this.cache.cachedFiles, document.uri);
            if (token.isCancellationRequested) {
                return resolve([]);
            }

            let filtered = items.filter(o => o.declaration.name.startsWith(searchWord)).map(o => {
                let item = new CompletionItem(o.declaration.name);
                item.detail = o.alias || o.libraryName;
                return item;
            });

            if (token.isCancellationRequested) {
                return resolve([]);
            }

            resolve(filtered);
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
