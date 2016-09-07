import {ResolveIndex} from '../caches/ResolveIndex';
import {ExtensionConfig} from '../ExtensionConfig';
import {CommandQuickPickItem, ResolveQuickPickItem} from '../models/QuickPickItems';
import {DefaultDeclaration, ModuleDeclaration} from '../models/TsDeclaration';
import {TshCommand} from '../models/TshCommand';
import {TsDefaultImport, TsExternalModuleImport, TsImport, TsNamedImport, TsNamespaceImport, TsStringImport} from '../models/TsImport';
import {TsResolveSpecifier} from '../models/TsResolveSpecifier';
import {TsResourceParser} from '../parser/TsResourceParser';
import {ResolveQuickPickProvider} from '../provider/ResolveQuickPickProvider';
import {Logger, LoggerFactory} from '../utilities/Logger';
import {BaseExtension} from './BaseExtension';
import {inject, injectable} from 'inversify';
import {join, normalize, parse, relative} from 'path';
import {commands, ExtensionContext, FileSystemWatcher, Position, StatusBarAlignment, Uri, window, workspace} from 'vscode';

const importMatcher = /^import\s.*;$/,
    resolverOk = 'Resolver $(check)',
    resolverSyncing = 'Resolver $(sync)',
    resolverErr = 'Resolver $(flame)'; //,
//TYPESCRIPT = { language: 'typescript' };

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

@injectable()
export class ResolveExtension extends BaseExtension {
    private logger: Logger;
    private statusBarItem = window.createStatusBarItem(StatusBarAlignment.Left, 4);
    private fileWatcher: FileSystemWatcher = workspace.createFileSystemWatcher('{**/*.ts,**/package.json,**/typings.json}', true);

    constructor( @inject('LoggerFactory') loggerFactory: LoggerFactory,
        private pickProvider: ResolveQuickPickProvider,
        private parser: TsResourceParser,
        private config: ExtensionConfig,
        private index: ResolveIndex) {
        super();

        this.logger = loggerFactory('ResolveExtension');

        this.logger.info('Extension instantiated.');
    }

    public getGuiCommands(): CommandQuickPickItem[] {
        return [
            new CommandQuickPickItem(
                'Import resolver: Add import',
                '',
                'Does open the list of unimported symbols.',
                new TshCommand(() => this.addImport())
            ),
            new CommandQuickPickItem(
                'Import resolver: Add import under cursor',
                `right now: '${this.getSymbolUnderCursor()}'`,
                'Adds the symbol under the cursor and opens a list if multiple are possible.',
                new TshCommand(() => this.addImportUnderCursor())
            ),
            new CommandQuickPickItem(
                'Import resolver: Organize imports',
                '',
                'Sorts imports and removes unused imports.',
                new TshCommand(() => this.organizeImports())
            ),
            new CommandQuickPickItem(
                'Import resolver: Rebuild cache',
                `currently: ${Object.keys(this.index.index).length} symbols`,
                'Does rebuild the whole symbol index.',
                new TshCommand(() => this.refreshCache())
            )
        ];
    }

    public initialize(context: ExtensionContext): void {
        context.subscriptions.push(commands.registerTextEditorCommand('typescriptHero.resolve.addImport', () => this.addImport()));
        context.subscriptions.push(commands.registerTextEditorCommand('typescriptHero.resolve.addImportUnderCursor', () => this.addImportUnderCursor()));
        context.subscriptions.push(commands.registerTextEditorCommand('typescriptHero.resolve.organizeImports', () => this.organizeImports()));
        context.subscriptions.push(commands.registerCommand('typescriptHero.resolve.rebuildCache', () => this.refreshCache()));
        //context.subscriptions.push(languages.registerCompletionItemProvider(TYPESCRIPT, completionProvider, ...RESOLVE_TRIGGER_CHARACTERS));
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
                this.logger.info('package.json or typings.json modified. Refreshing cache.');
                this.refreshCache();
            } else {
                this.logger.info(`File "${uri.fsPath}" changed. Reindexing file.`);
                this.refreshCache(uri);
            }
        });
        this.fileWatcher.onDidDelete(uri => {
            if (uri.fsPath.endsWith('.d.ts')) {
                return;
            }
            this.logger.info(`File "${uri.fsPath}" deleted. Removing file.`);
            this.index.removeForFile(uri.fsPath);
        });
        this.logger.info('Initialized.');
    }

    public dispose(): void {
        this.logger.info('Dispose called.');
    }

    private addImport(): void {
        if (!this.index.indexReady) {
            this.showCacheWarning();
            return;
        }
        this.pickProvider.addImportPick(window.activeTextEditor).then(o => {
            if (o) {
                this.logger.info('Add import to document', { resolveItem: o });
                this.addImportToDocument(o);
            }
        });
    }

    private addImportUnderCursor(): void {
        if (!this.index.indexReady) {
            this.showCacheWarning();
            return;
        }
        let selectedSymbol = this.getSymbolUnderCursor();
        if (!!!selectedSymbol) {
            return;
        }
        this.pickProvider.addImportUnderCursorPick(window.activeTextEditor, selectedSymbol).then(o => {
            if (o) {
                this.logger.info('Add import to document', { resolveItem: o });
                this.addImportToDocument(o);
            }
        });
    }

    private organizeImports(): void {
        // this.parser
        //     .parseSource(window.activeTextEditor.document.getText())
        //     .then(parsed => {
        //         let keep: TsImport[] = [];
        //         for (let actImport of parsed.imports) {
        //             if (actImport instanceof TsNamespaceImport || actImport instanceof TsExternalModuleImport || actImport instanceof TsDefaultImport) {
        //                 if (parsed.nonLocalUsages.indexOf(actImport.alias) > -1) {
        //                     keep.push(actImport);
        //                 }
        //             } else if (actImport instanceof TsNamedImport) {
        //                 actImport.specifiers = actImport.specifiers.filter(o => parsed.nonLocalUsages.indexOf(o.alias || o.specifier) > -1);
        //                 if (actImport.specifiers.length) {
        //                     keep.push(actImport);
        //                 }
        //             } else if (actImport instanceof TsStringImport) {
        //                 keep.push(actImport);
        //             }
        //         }
        //         this.commitDocumentImports(keep);
        //     })
        //     .catch(e => {
        //         this.logger.error('An error happend during "organize imports".', { error: e });
        //     });
    }

    private refreshCache(file?: Uri): void {
        this.statusBarItem.text = resolverSyncing;

        if (file) {
            this.index.rebuildForFile(file.fsPath)
                .then(() => this.statusBarItem.text = resolverOk)
                .catch(() => this.statusBarItem.text = resolverErr);
        } else {
            this.index.buildIndex()
                .then(() => this.statusBarItem.text = resolverOk)
                .catch(() => this.statusBarItem.text = resolverErr);
        }
    }

    private addImportToDocument(item: ResolveQuickPickItem): Promise<void> {
        return this.parser
            .parseSource(window.activeTextEditor.document.getText())
            .then(parsedDocument => {
                let imports = parsedDocument.imports;
                let declaration = item.declarationInfo.declaration;

                let imported = imports.find(o => {
                    let lib = o.libraryName;
                    if (lib.startsWith('.')) {
                        lib = workspace.asRelativePath(normalize(join(parse(window.activeTextEditor.document.fileName).dir, o.libraryName)));
                    }
                    return lib === item.declarationInfo.from && !(o instanceof TsDefaultImport);
                });
                let promise = Promise.resolve(imports),
                    defaultImportAlias = () => {
                        promise = promise.then(imports => window.showInputBox({
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
                    if (declaration instanceof ModuleDeclaration) {
                        imports.push(new TsNamespaceImport(item.description, item.label));
                    } else if (declaration instanceof DefaultDeclaration) {
                        defaultImportAlias();
                    } else {
                        let activeFile = parse(workspace.asRelativePath(window.activeTextEditor.document.fileName)).dir;
                        let relativePath = relative(activeFile, item.declarationInfo.from).replace(/[/]?index$/, '');
                        if (!relativePath.startsWith('.')) {
                            relativePath = './' + relativePath;
                        }
                        let named = new TsNamedImport(relativePath);
                        named.specifiers.push(new TsResolveSpecifier(item.label));
                        imports.push(named);
                    }
                } else if (declaration instanceof DefaultDeclaration) {
                    defaultImportAlias();
                } else if (imported instanceof TsNamedImport) {
                    imported.specifiers.push(new TsResolveSpecifier(item.label));
                }

                console.log(imports);
                //return promise.then(imports => this.commitDocumentImports(imports));
            });
    }

    private commitDocumentImports(imports: TsImport[]): void {
        // imports = [
        //     ...imports.filter(o => o instanceof TsStringImport).sort(importSort),
        //     ...imports.filter(o => !(o instanceof TsStringImport)).sort(importSort)
        // ];
        // let editor = window.activeTextEditor;
        // editor.edit(builder => {
        //     for (let lineNr = 0; lineNr < editor.document.lineCount; lineNr++) {
        //         let line = editor.document.lineAt(lineNr);
        //         if (line.text.match(importMatcher)) {
        //             builder.delete(line.rangeIncludingLineBreak);
        //         }
        //     }
        //     builder.insert(new Position(0, 0), imports.reduce((all, cur) => all += cur.toImport(this.config.resolver.importOptions), ''));
        // });
    }

    private showCacheWarning(): void {
        window.showWarningMessage('Please wait a few seconds longer until the symbol cache has been build.');
    }

    private getSymbolUnderCursor(): string {
        let editor = window.activeTextEditor;
        if (!editor) {
            return '';
        }
        let selection = editor.selection,
            word = editor.document.getWordRangeAtPosition(selection.active);
        return word && !word.isEmpty ? editor.document.getText(word) : '';
    }
}
