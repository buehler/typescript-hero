import {SymbolCache} from '../utilities/SymbolCache';
import * as vscode from 'vscode';

export class CompletionItemProvider implements vscode.CompletionItemProvider {

    constructor(private cache: SymbolCache) { console.log('asdf') }

    public provideCompletionItems(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken): Thenable<vscode.CompletionItem[]> {
        console.log('called');
        if (this.cache.symbolCache.length <= 0) {
            return Promise.resolve([]);
        }

        return new Promise((resolve, reject) => {
            let lineText = document.lineAt(position.line).text;
            console.log('now', lineText);
            return resolve([]);
            // if (lineText.match(/^\s*\/\//) || (lineText.substring(0, position.character).match(/[\"\']/g) || []).length % 2 === 1) {
            //     return resolve([]);
            // }

            // // get current word
            // let wordAtPosition = document.getWordRangeAtPosition(position);
            // let currentWord = '';
            // if (wordAtPosition && wordAtPosition.start.character < position.character) {
            //     let word = document.getText(wordAtPosition);
            //     currentWord = word.substr(0, position.character - wordAtPosition.start.character);
            // }

            // if (currentWord.match(/^\d+$/)) {
            //     return resolve([]);
            // }
        });
    }
}
