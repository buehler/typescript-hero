import {injectable} from 'inversify';
import {CancellationToken, CompletionItem, CompletionItemProvider, Position, TextDocument} from 'vscode';

@injectable()
export class ResolveCompletionItemProvider implements CompletionItemProvider {
    constructor() {
        
    }

    provideCompletionItems(document: TextDocument, position: Position, token: CancellationToken): CompletionItem[] {
        console.log('called');
        return [];
    }
}

export const RESOLVE_TRIGGER_CHARACTERS = [
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
