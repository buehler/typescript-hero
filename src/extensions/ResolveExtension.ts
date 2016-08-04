import {ResolveCache} from '../caches/ResolveCache';
import {ExtensionConfig} from '../ExtensionConfig';
import {ResolveQuickPickItem} from '../models/ResolveQuickPickItem';
import {TsDefaultDeclaration, TsModuleDeclaration} from '../models/TsDeclaration';
import {TsDefaultImport, TsExternalModuleImport, TsImport, TsNamedImport, TsNamespaceImport, TsStringImport} from '../models/TsImport';
import {TsResolveSpecifier} from '../models/TsResolveSpecifier';
import {TsResolveFileParser} from '../parser/TsResolveFileParser';
import {QuickPickProvider} from '../provider/QuickPickProvider';
import * as inversify from 'inversify';
import * as vscode from 'vscode';

const importMatcher = /^import\s.*;$/,
    resolverOk = 'Resolver $(check)',
    resolverSyncing = 'Resolver $(sync)',
    resolverErr = 'Resolver $(flame)';

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
    private statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 4);
    private fileWatcher: vscode.FileSystemWatcher = vscode.workspace.createFileSystemWatcher('{**/*.ts,**/package.json,**/typings.json}', true);

    constructor( @inversify.inject('context') context: vscode.ExtensionContext,
        private cache: ResolveCache,
        private pickProvider: QuickPickProvider,
        private config: ExtensionConfig,
        private parser: TsResolveFileParser) {

        console.log('ResolveExtension instantiated');
        // TODO: file watcher; cancel token
        context.subscriptions.push(vscode.commands.registerTextEditorCommand('typescriptHero.resolve.addImport', () => this.addImport()));
        context.subscriptions.push(vscode.commands.registerTextEditorCommand('typescriptHero.resolve.organizeImports', () => this.organizeImports()));
        context.subscriptions.push(vscode.commands.registerCommand('typescriptHero.resolve.rebuildCache', () => this.refreshCache()));
        context.subscriptions.push(this.statusBarItem);
        context.subscriptions.push(this.fileWatcher);

        this.statusBarItem.text = resolverOk;
        this.statusBarItem.tooltip = 'Click to manually reindex all files.';
        this.statusBarItem.command = 'typescriptHero.resolve.rebuildCache';
        this.statusBarItem.show();

        this.refreshCache();

        this.fileWatcher.onDidChange(uri => {
            if (uri.fsPath.endsWith('.d.ts')) {
                return;
            }
            if (uri.fsPath.endsWith('package.json') || uri.fsPath.endsWith('typings.json')) {
                console.log('ResolveExtension: package.json or typings.json modified. Refreshing cache.');
                this.refreshCache();
            } else {
                console.log(`ResolveExtension: File "${uri.fsPath}" changed. Reindexing file.`);
                this.refreshCache(uri);
            }
        });
        this.fileWatcher.onDidDelete(uri => {
            if (uri.fsPath.endsWith('.d.ts')) {
                return;
            }
            this.cache.removeForFile(uri);
        });
    }

    private addImport(): void {
        if (!this.cache.cacheReady) {
            this.showCacheWarning();
            return;
        }
        this.pickProvider.addImportPick(vscode.window.activeTextEditor.document.uri, vscode.window.activeTextEditor.document.getText()).then(o => {
            if (o) {
                this.addImportToDocument(o);
            }
        });
    }

    private organizeImports(): void {
        this.parser
            .parseSource(vscode.window.activeTextEditor.document.getText())
            .then(parsed => {
                let keep: TsImport[] = [];
                for (let actImport of parsed.imports) {
                    if (actImport instanceof TsNamespaceImport || actImport instanceof TsExternalModuleImport || actImport instanceof TsDefaultImport) {
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
            })
            .catch(e => {
                console.error('ERROR HAPPEND', { e });
            });
    }

    private refreshCache(file?: vscode.Uri): void {
        this.statusBarItem.text = resolverSyncing;

        if (file) {
            this.cache.rebuildForFile(file)
                .then(() => this.statusBarItem.text = resolverOk)
                .catch(() => this.statusBarItem.text = resolverErr);
        } else {
            this.cache.buildCache()
                .then(() => this.statusBarItem.text = resolverOk)
                .catch(() => this.statusBarItem.text = resolverErr);
        }
    }

    private addImportToDocument(item: ResolveQuickPickItem): Promise<void> {
        return this.parser.parseSource(vscode.window.activeTextEditor.document.getText()).then(docResolve => {
            let imports = [...docResolve.imports];
            let declaration = item.resolveItem.declaration;

            let imported = imports.find(o => o.libraryName === item.resolveItem.libraryName && !(o instanceof TsDefaultImport)),
                promise = Promise.resolve(imports),
                defaultImportAlias = () => {
                    promise = promise.then(imports => vscode.window.showInputBox({
                        prompt: 'Please enter a variable name for the default export..',
                        placeHolder: 'Default export name',
                        validateInput: s => !!s ? '' : 'Please enter a variable name'
                    }).then(defaultAlias => {
                        if (defaultAlias) {
                            imports.push(new TsDefaultImport(item.label, defaultAlias));
                        }
                        return imports;
                    }));
                };

            if (!imported) {
                if (declaration instanceof TsModuleDeclaration) {
                    imports.push(new TsNamespaceImport(item.description, item.label));
                } else if (declaration instanceof TsDefaultDeclaration) {
                    defaultImportAlias();
                } else {
                    let named = new TsNamedImport(item.resolveItem.libraryName);
                    named.specifiers.push(new TsResolveSpecifier(item.label));
                    imports.push(named);
                }
            } else if (declaration instanceof TsDefaultDeclaration) {
                defaultImportAlias();
            } else if (imported instanceof TsNamedImport) {
                imported.specifiers.push(new TsResolveSpecifier(item.label));
            }

            return promise.then(imports => this.commitDocumentImports(imports));
        });
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
