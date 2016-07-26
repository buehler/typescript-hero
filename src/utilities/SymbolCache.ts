import {Logger} from './Logger';
import * as vscode from 'vscode';

const cacheCheck = 'Symbol cache $(check)',
    cacheSyncing = 'Symbol cache $(sync)',
    cacheErr = 'Symbol cache $(flame)';

const errColor = '#CE4543',
    okColor = '#FFF';

export class SymbolCache {
    private static _instance: SymbolCache = new SymbolCache();
    private statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
    private synching: boolean;


    public static get instance(): SymbolCache {
        return SymbolCache._instance;
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
            this.synching = true;
            this.statusBarItem.text = cacheSyncing;

            this.analyzeSymbols()
                .then(symbols => {
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

    private analyzeSymbols(): Promise<any[]> {
        return new Promise((resolve, reject) => {
            resolve();
        });
    }
}
