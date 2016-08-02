import * as inversify from 'inversify';
import * as vscode from 'vscode';
import {ResolveCache} from '../caches/ResolveCache';
import {QuickPickProvider} from '../provider/QuickPickProvider';
import {ResolveQuickPickItem} from '../models/ResolveQuickPickItem';
import {TsImport, TsNamedImport} from '../models/TsImport';
import {ExtensionConfig} from '../ExtensionConfig';
import {TsResolveSpecifier} from '../models/TsResolveSpecifier';

const importMatcher = /^import\s.*;$/;

function importSort(i1: TsImport, i2: TsImport): number {
    let strA = i1.libraryName.toLowerCase(),
        strB = i2.libraryName.toLowerCase();

    if (strA < strB) {
        return -1;
    } else if (strA > strB) {
        return 1;
    }
    return 0;
}

@inversify.injectable()
export class ResolveExtension {
    constructor( @inversify.inject('context') context: vscode.ExtensionContext, private cache: ResolveCache, private pickProvider: QuickPickProvider, private config: ExtensionConfig) {
        console.log('ResolveExtension instantiated');

        context.subscriptions.push(vscode.commands.registerCommand('typescriptHero.addImport', () => this.addImport()));
        vscode.workspace.onDidSaveTextDocument(event => this.cache.refreshCache());
    }

    private addImport(): void {
        if (!this.cache.cacheReady) {
            this.showCacheWarning();
            return;
        }
        this.pickProvider.addImportPick(vscode.window.activeTextEditor.document.uri).then(o => {
            if (o) {
                this.addImportToDocument(o);
            }
        });
    }

    private addImportToDocument(item: ResolveQuickPickItem): void {
        let docResolve = this.cache.getResolveFileForPath(vscode.window.activeTextEditor.document.uri);
        let imports = [...docResolve.imports];

        let imported = imports.find(o => o.libraryName === item.resolveItem.libraryName);
        if (!imported) {
            let named = new TsNamedImport(item.resolveItem.libraryName);
            named.specifiers.push(new TsResolveSpecifier(item.label));
            imports.push(named);
        } else {
            if (imported instanceof TsNamedImport) {
                imported.specifiers.push(new TsResolveSpecifier(item.label));
            }
        }

        imports = imports.sort(importSort);

        let editor = vscode.window.activeTextEditor;
        editor.edit(builder => {
            for (let lineNr = 0; lineNr < editor.document.lineCount; lineNr++) {
                let line = editor.document.lineAt(lineNr);
                if (line.text.match(importMatcher)) {
                    builder.delete(line.rangeIncludingLineBreak);
                }
            }
            builder.insert(new vscode.Position(0, 0), imports.reduce((all, cur) => all += cur.toImport(this.config.pathStringDelimiter), ''));
        });
    }

    private showCacheWarning(): void {
        vscode.window.showWarningMessage('Please wait a few seconds longer until the symbol cache has been build.');
    }
}
