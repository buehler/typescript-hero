import {ResolveIndex} from '../caches/ResolveIndex';
import {ExtensionConfig} from '../ExtensionConfig';
import {CommandQuickPickItem, ResolveQuickPickItem} from '../models/QuickPickItems';
import {DefaultDeclaration, ModuleDeclaration} from '../models/TsDeclaration';
import {TshCommand} from '../models/TshCommand';
import {
    TsAliasedImport,
    TsDefaultImport,
    TsExternalModuleImport,
    TsImport,
    TsNamedImport,
    TsNamespaceImport,
    TsStringImport
} from '../models/TsImport';
import {TsResolveSpecifier} from '../models/TsResolveSpecifier';
import {TsFile} from '../models/TsResource';
import {TsResourceParser} from '../parser/TsResourceParser';
import {ResolveCompletionItemProvider} from '../provider/ResolveCompletionItemProvider';
import {ResolveQuickPickProvider} from '../provider/ResolveQuickPickProvider';
import {Logger, LoggerFactory} from '../utilities/Logger';
import {
    getAbsolutLibraryName,
    getImportInsertPosition,
    getRelativeLibraryName
} from '../utilities/ResolveIndexExtensions';
import {BaseExtension} from './BaseExtension';
import {inject, injectable} from 'inversify';
import {
    commands,
    ExtensionContext,
    FileSystemWatcher,
    languages,
    StatusBarAlignment,
    Uri,
    window,
    workspace
} from 'vscode';

type ImportInformation = {};

const resolverOk = 'Resolver $(check)',
    resolverSyncing = 'Resolver $(sync)',
    resolverErr = 'Resolver $(flame)',
    TYPESCRIPT = 'typescript';

function stringSort(strA: string, strB: string): number {
    if (strA < strB) {
        return -1;
    } else if (strA > strB) {
        return 1;
    }
    return 0;
}

function importSort(i1: TsImport, i2: TsImport): number {
    let strA = i1.libraryName.toLowerCase(),
        strB = i2.libraryName.toLowerCase();

    return stringSort(strA, strB);
}

function specifierSort(i1: TsResolveSpecifier, i2: TsResolveSpecifier): number {
    return stringSort(i1.specifier, i2.specifier);
}

function compareIgnorePatterns(local: string[], config: string[]): boolean {
    if (local.length !== config.length) {
        return false;
    }
    let localSorted = local.sort(),
        configSorted = config.sort();

    for (let x = 0; x < configSorted.length; x++) {
        if (configSorted[x] !== localSorted[x]) {
            return false;
        }
    }

    return true;
}

@injectable()
export class ResolveExtension extends BaseExtension {
    private logger: Logger;
    private statusBarItem = window.createStatusBarItem(StatusBarAlignment.Left, 4);
    private fileWatcher: FileSystemWatcher = workspace.createFileSystemWatcher('{**/*.ts,**/package.json,**/typings.json}', true);
    private ignorePatterns: string[];

    constructor( @inject('LoggerFactory') loggerFactory: LoggerFactory,
        private pickProvider: ResolveQuickPickProvider,
        private parser: TsResourceParser,
        private config: ExtensionConfig,
        private index: ResolveIndex,
        private completionProvider: ResolveCompletionItemProvider) {
        super();

        this.logger = loggerFactory('ResolveExtension');
        this.ignorePatterns = this.config.resolver.ignorePatterns;

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
                new TshCommand(() => this.refreshIndex())
            )
        ];
    }

    public initialize(context: ExtensionContext): void {
        context.subscriptions.push(commands.registerTextEditorCommand('typescriptHero.resolve.addImport', () => this.addImport()));
        context.subscriptions.push(commands.registerTextEditorCommand('typescriptHero.resolve.addImportUnderCursor', () => this.addImportUnderCursor()));
        context.subscriptions.push(commands.registerTextEditorCommand('typescriptHero.resolve.organizeImports', () => this.organizeImports()));
        context.subscriptions.push(commands.registerCommand('typescriptHero.resolve.rebuildCache', () => this.refreshIndex()));
        context.subscriptions.push(languages.registerCompletionItemProvider(TYPESCRIPT, this.completionProvider)); //without trigger chars
        context.subscriptions.push(this.statusBarItem);
        context.subscriptions.push(this.fileWatcher);

        this.statusBarItem.text = resolverOk;
        this.statusBarItem.tooltip = 'Click to manually reindex all files.';
        this.statusBarItem.command = 'typescriptHero.resolve.rebuildCache';
        this.statusBarItem.show();

        this.refreshIndex();

        this.fileWatcher.onDidChange(uri => {
            if (uri.fsPath.endsWith('.d.ts')) {
                return;
            }
            if (uri.fsPath.endsWith('package.json') || uri.fsPath.endsWith('typings.json')) {
                this.logger.info('package.json or typings.json modified. Refreshing index.');
                this.refreshIndex();
            } else {
                this.logger.info(`File "${uri.fsPath}" changed. Reindexing file.`);
                this.refreshIndex(uri);
            }
        });
        this.fileWatcher.onDidDelete(uri => {
            if (uri.fsPath.endsWith('.d.ts')) {
                return;
            }
            this.logger.info(`File "${uri.fsPath}" deleted. Removing file.`);
            this.index.removeForFile(uri.fsPath);
        });

        context.subscriptions.push(workspace.onDidChangeConfiguration(() => {
            if (!compareIgnorePatterns(this.ignorePatterns, this.config.resolver.ignorePatterns)) {
                this.logger.info('The typescriptHero.resolver.ignorePatterns setting was modified, reload the index.');
                this.refreshIndex();
                this.ignorePatterns = this.config.resolver.ignorePatterns;
            }
        }));

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
        this.pickProvider.addImportPick(window.activeTextEditor.document).then(o => {
            if (o) {
                this.logger.info('Add import to document', { resolveItem: o });
                this.addImportToDocument(o);
            }
        }, err => {
            this.logger.error('An error happend during import picking', { error: err });
            window.showErrorMessage('The import cannot be completed, there was an error during the process.');
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
        this.pickProvider.addImportUnderCursorPick(window.activeTextEditor.document, selectedSymbol).then(o => {
            if (o) {
                this.logger.info('Add import to document', { resolveItem: o });
                this.addImportToDocument(o);
            }
        }, err => {
            this.logger.error('An error happend during import picking', { error: err });
            window.showErrorMessage('The import cannot be completed, there was an error during the process.');
        });
    }

    private organizeImports(): Promise<boolean> {
        return this.parser
            .parseSource(window.activeTextEditor.document.getText())
            .then(parsed => {
                let keep: TsImport[] = [];
                for (let actImport of parsed.imports) {
                    if (actImport instanceof TsNamespaceImport || actImport instanceof TsExternalModuleImport || actImport instanceof TsDefaultImport) {
                        if (parsed.nonLocalUsages.indexOf(actImport.alias) > -1) {
                            keep.push(actImport);
                        }
                    } else if (actImport instanceof TsNamedImport) {
                        actImport.specifiers = actImport.specifiers.filter(o => parsed.nonLocalUsages.indexOf(o.alias || o.specifier) > -1).sort(specifierSort);
                        if (actImport.specifiers.length) {
                            keep.push(actImport);
                        }
                    } else if (actImport instanceof TsStringImport) {
                        keep.push(actImport);
                    }
                }
                return this.commitDocumentImports(parsed, keep, true);
            })
            .catch(e => {
                this.logger.error('An error happend during "organize imports".', { error: e });
            });
    }

    private refreshIndex(file?: Uri): void {
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

    private addImportToDocument(item: ResolveQuickPickItem): Promise<boolean> {
        return Promise
            .all([
                this.parser.parseSource(window.activeTextEditor.document.getText()),
                this.parser.parseSource(window.activeTextEditor.document.getText())
            ])
            .then((parsedDocuments: any) => {
                let imports = parsedDocuments[0].imports;
                let declaration = item.declarationInfo.declaration;

                let imported = imports.find(o => {
                    let lib = getAbsolutLibraryName(o.libraryName, window.activeTextEditor.document.fileName);
                    return lib === item.declarationInfo.from && !(o instanceof TsDefaultImport);
                });

                let specifiers = imports.reduce((all, cur) => {
                    if (cur instanceof TsNamedImport) {
                        all = all.concat(cur.specifiers.map(o => o.alias || o.specifier));
                    } else if (cur instanceof TsAliasedImport) {
                        all.push(cur.alias);
                    }
                    return all;
                }, []);

                let promise = Promise.resolve(imports),
                    defaultImportAlias = (declaration: DefaultDeclaration) => {
                        promise = promise.then(imports => window.showInputBox({
                            prompt: 'Please enter a variable name for the default export..',
                            placeHolder: 'Default export name',
                            //TODO: wait for bugfix of vscode ... code: value: declaration.name, https://github.com/Microsoft/vscode/issues/11503
                            validateInput: s => !!s ? '' : 'Please enter a variable name'
                        }).then(defaultAlias => {
                            if (defaultAlias) {
                                imports.push(new TsDefaultImport(getRelativeLibraryName(item.description, window.activeTextEditor.document.fileName), defaultAlias));
                            }
                            return imports;
                        }));
                    },
                    duplicateSpecifier = (imp: TsNamedImport, pushToImports: boolean) => {
                        promise = promise.then(imports => window.showInputBox({
                            prompt: 'Please enter an alias for the specifier..',
                            placeHolder: 'Alias for specifier',
                            validateInput: s => !!s ? '' : 'Please enter a variable name'
                        }).then(alias => {
                            imp.specifiers.push(new TsResolveSpecifier(item.label, alias));
                            if (alias && pushToImports) {
                                imports.push(imp);
                            }
                            return imports;
                        }));
                    };

                if (!imported) {
                    if (declaration instanceof ModuleDeclaration) {
                        imports.push(new TsNamespaceImport(item.description, item.label));
                    } else if (declaration instanceof DefaultDeclaration) {
                        defaultImportAlias(declaration);
                    } else {
                        let library = getRelativeLibraryName(item.declarationInfo.from, window.activeTextEditor.document.fileName);
                        let named = new TsNamedImport(library);
                        if (specifiers.some(o => o === item.label)) {
                            duplicateSpecifier(named, true);
                        } else {
                            named.specifiers.push(new TsResolveSpecifier(item.label));
                            imports.push(named);
                        }
                    }
                } else if (declaration instanceof DefaultDeclaration) {
                    defaultImportAlias(declaration);
                } else if (imported instanceof TsNamedImport) {
                    if (specifiers.some(o => o === item.label)) {
                        duplicateSpecifier(imported, false);
                    } else {
                        imported.specifiers.push(new TsResolveSpecifier(item.label));
                    }
                }
                return promise.then(imports => this.commitDocumentImports(parsedDocuments[1], imports));
            });
    }

    private commitDocumentImports(parsedDocument: TsFile, newImports: TsImport[], sortAndReorder: boolean = false): Thenable<boolean> {
        return window.activeTextEditor.edit(builder => {
            if (sortAndReorder) {
                for (let imp of parsedDocument.imports) {
                    builder.delete(imp.getRange(window.activeTextEditor.document));
                }
                newImports = [
                    ...newImports.filter(o => o instanceof TsStringImport).sort(importSort),
                    ...newImports.filter(o => !(o instanceof TsStringImport)).sort(importSort)
                ];
                builder.insert(
                    getImportInsertPosition(this.config.resolver.newImportLocation, window.activeTextEditor),
                    newImports.reduce((all, cur) => all += cur.toImport(this.config.resolver.importOptions), '')
                );
            } else {
                for (let imp of parsedDocument.imports) {
                    if (!newImports.find(o => o.libraryName === imp.libraryName)) {
                        builder.delete(imp.getRange(window.activeTextEditor.document));
                    }
                }
                for (let imp of newImports) {
                    let existingImport = parsedDocument.imports.find(o => o.libraryName === imp.libraryName);
                    if (existingImport) {
                        builder.replace(existingImport.getRange(window.activeTextEditor.document), imp.toImport(this.config.resolver.importOptions));
                    } else {
                        builder.insert(
                            getImportInsertPosition(this.config.resolver.newImportLocation, window.activeTextEditor),
                            imp.toImport(this.config.resolver.importOptions)
                        );
                    }
                }
            }
        });
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
