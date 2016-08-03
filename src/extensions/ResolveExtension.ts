import {ResolveCache} from '../caches/ResolveCache';
import {ExtensionConfig} from '../ExtensionConfig';
import {ResolveQuickPickItem} from '../models/ResolveQuickPickItem';
import {TsExternalModuleImport, TsImport, TsNamedImport, TsNamespaceImport, TsStringImport} from '../models/TsImport';
import {TsResolveSpecifier} from '../models/TsResolveSpecifier';
import {TsResolveFileParser} from '../parser/TsResolveFileParser';
import {QuickPickProvider} from '../provider/QuickPickProvider';
import * as inversify from 'inversify';
import * as vscode from 'vscode';

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
    constructor( @inversify.inject('context') context: vscode.ExtensionContext,
        private cache: ResolveCache,
        private pickProvider: QuickPickProvider,
        private config: ExtensionConfig,
        private parser: TsResolveFileParser) {

        console.log('ResolveExtension instantiated');
        // TODO: file watcher; cancel token
        context.subscriptions.push(vscode.commands.registerCommand('typescriptHero.resolve.addImport', () => this.addImport()));
        context.subscriptions.push(vscode.commands.registerCommand('typescriptHero.resolve.organizeImports', () => this.organizeImports()));
        context.subscriptions.push(vscode.commands.registerCommand('typescriptHero.resolve.rebuildCache', () => this.cache.buildCache()));
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

    private organizeImports(): void {
        let parsed = this.parser.parseFile(vscode.window.activeTextEditor.document.uri);
        let keep: TsImport[] = [];

        for (let actImport of parsed.imports) {
            if (actImport instanceof TsNamespaceImport || actImport instanceof TsExternalModuleImport) {
                if (parsed.nonLocalUsages.indexOf(actImport.alias) > -1) {
                    keep.push(actImport);
                }
            } else if (actImport instanceof TsNamedImport) {
                actImport.specifiers = actImport.specifiers.filter(o => parsed.nonLocalUsages.indexOf(o.alias || o.specifier) > -1);
                if (actImport.specifiers.length) {
                    keep.push(actImport);
                }
            } else if (actImport instanceof TsStringImport) {
                keep.push(actImport);
            }
        }

        this.commitDocumentImports(keep);
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

        this.commitDocumentImports(imports);
    }

    private commitDocumentImports(imports: TsImport[]): void {
        imports = [
            ...imports.filter(o => o instanceof TsStringImport).sort(importSort),
            ...imports.filter(o => !(o instanceof TsStringImport)).sort(importSort)
        ];
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
