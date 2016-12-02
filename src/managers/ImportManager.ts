import { ObjectManager } from './ObjectManager';
import { ResolveQuickPickItem } from '../models/QuickPickItems';
import { DeclarationInfo, ResolveIndex } from '../caches/ResolveIndex';
import { ExtensionConfig } from '../ExtensionConfig';
import { Injector } from '../IoC';
import { ImportProxy } from '../models/ImportProxy';
import { DefaultDeclaration, ModuleDeclaration } from '../models/TsDeclaration';
import {
    TsAliasedImport,
    TsDefaultImport,
    TsExternalModuleImport,
    TsImport,
    TsNamedImport,
    TsNamespaceImport,
    TsStringImport
} from '../models/TsImport';
import { TsResolveSpecifier } from '../models/TsResolveSpecifier';
import { TsFile } from '../models/TsResource';
import { TsResourceParser } from '../parser/TsResourceParser';
import {
    getAbsolutLibraryName,
    getDeclarationsFilteredByImports,
    getImportInsertPosition,
    getRelativeLibraryName
} from '../utilities/ResolveIndexExtensions';
import { InputBoxOptions, TextDocument, TextEdit, window, workspace, WorkspaceEdit } from 'vscode';

/**
 * String-Sort function.
 * 
 * @param {string} strA
 * @param {string} strB
 * @returns {number}
 */
function stringSort(strA: string, strB: string): number {
    if (strA < strB) {
        return -1;
    } else if (strA > strB) {
        return 1;
    }
    return 0;
}

/**
 * Order imports by library name.
 * 
 * @param {TsImport} i1
 * @param {TsImport} i2
 * @returns {number}
 */
function importSort(i1: TsImport, i2: TsImport): number {
    let strA = i1.libraryName.toLowerCase(),
        strB = i2.libraryName.toLowerCase();

    return stringSort(strA, strB);
}

/**
 * Order specifiers by name.
 * 
 * @param {TsResolveSpecifier} i1
 * @param {TsResolveSpecifier} i2
 * @returns {number}
 */
function specifierSort(i1: TsResolveSpecifier, i2: TsResolveSpecifier): number {
    return stringSort(i1.specifier, i2.specifier);
}

/**
 * Management class for the imports of a document. Can add and remove imports to the document
 * and commit the virtual document to the TextEditor.
 * 
 * @export
 * @class ImportManager
 */
export class ImportManager implements ObjectManager {
    private static get parser(): TsResourceParser {
        return Injector.get(TsResourceParser);
    }

    private static get config(): ExtensionConfig {
        return Injector.get(ExtensionConfig);
    }

    private imports: TsImport[] = [];
    private userImportDecisions: { [usage: string]: DeclarationInfo[] }[] = [];
    private organize: boolean;

    /**
     * Document resource for this controller. Contains the parsed document.
     * 
     * @readonly
     * @type {TsFile}
     * @memberOf ImportManager
     */
    public get parsedDocument(): TsFile {
        return this._parsedDocument;
    }

    private constructor(public readonly document: TextDocument, private _parsedDocument: TsFile) {
        this.imports = _parsedDocument.imports.map(o => o.clone<TsImport>());
    }

    /**
     * Creates an instance of an ImportManager.
     * Does parse the document text first and returns a promise that
     * resolves to an ImportManager.
     * 
     * @static
     * @param {TextDocument} document The document that should be managed
     * @returns {Promise<ImportManager>}
     * 
     * @memberOf ImportManager
     */
    public static async create(document: TextDocument): Promise<ImportManager> {
        let source = await ImportManager.parser.parseSource(document.getText());
        source.imports = source.imports.map(
            o => o instanceof TsNamedImport || o instanceof TsDefaultImport ? new ImportProxy(o) : o
        );
        return new ImportManager(document, source);
    }

    /**
     * Adds an import for a declaration to the documents imports.
     * This index is merged and commited during the commit() function.
     * If it's a default import or there is a duplicate identifier, the controller will ask for the name on commit().
     * 
     * @param {DeclarationInfo} declarationInfo The import that should be added to the document
     * @returns {ImportManager}
     * 
     * @memberOf ImportManager
     */
    public addDeclarationImport(declarationInfo: DeclarationInfo): this {
        // If there is something already imported, it must be a NamedImport or a DefaultImport
        let alreadyImported: ImportProxy = this.imports.find(
            o => declarationInfo.from === getAbsolutLibraryName(o.libraryName, this.document.fileName) &&
                o instanceof ImportProxy
        ) as ImportProxy;

        if (alreadyImported) {
            // If we found an import for this declaration, it's either a default import or a named import
            if (declarationInfo.declaration instanceof DefaultDeclaration) {
                delete alreadyImported.defaultAlias;
                alreadyImported.defaultPurposal = declarationInfo.declaration.name;
            } else {
                alreadyImported.addSpecifier(declarationInfo.declaration.name);
            }
        } else {
            if (declarationInfo.declaration instanceof ModuleDeclaration) {
                this.imports.push(new TsNamespaceImport(
                    declarationInfo.from,
                    declarationInfo.declaration.name
                ));
            } else if (declarationInfo.declaration instanceof DefaultDeclaration) {
                let imp = new ImportProxy(getRelativeLibraryName(
                    declarationInfo.from,
                    this.document.fileName
                ));
                imp.defaultPurposal = declarationInfo.declaration.name;
                this.imports.push(imp);
            } else {
                let imp = new ImportProxy(getRelativeLibraryName(
                    declarationInfo.from,
                    this.document.fileName
                ));
                imp.specifiers.push(new TsResolveSpecifier(declarationInfo.declaration.name));
                this.imports.push(imp);
            }
        }

        return this;
    }

    /**
     * Adds all missing imports to the actual document. If multiple declarations are found for one missing
     * specifier, the user is asked when the commit() function is executed.
     * 
     * @param {ResolveIndex} resolveIndex
     * @returns {this}
     * 
     * @memberOf ImportManager
     */
    public addMissingImports(resolveIndex: ResolveIndex): this {
        let declarations = getDeclarationsFilteredByImports(
            resolveIndex,
            this.document.fileName,
            this.imports
        );

        for (let usage of this._parsedDocument.nonLocalUsages) {
            let foundDeclarations = declarations.filter(o => o.declaration.name === usage);
            if (foundDeclarations.length <= 0) {
                continue;
            } else if (foundDeclarations.length === 1) {
                this.addDeclarationImport(foundDeclarations[0]);
            } else {
                this.userImportDecisions[usage] = foundDeclarations;
            }
        }
        return this;
    }

    /**
     * Organizes the imports of the document. Orders all imports and removes unused imports.
     * Order:
     * 1. string-only imports (e.g. import 'reflect-metadata')
     * 2. rest, but in alphabetical order
     * 
     * @returns {ImportManager}
     * 
     * @memberOf ImportManager
     */
    public organizeImports(): this {
        this.organize = true;
        let keep: TsImport[] = [];

        for (let actImport of this.imports) {
            if (actImport instanceof TsNamespaceImport ||
                actImport instanceof TsExternalModuleImport) {
                if (this._parsedDocument.nonLocalUsages.indexOf(actImport.alias) > -1) {
                    keep.push(actImport);
                }
            } else if (actImport instanceof ImportProxy) {
                actImport.specifiers = actImport.specifiers
                    .filter(o => this._parsedDocument.nonLocalUsages.indexOf(o.alias || o.specifier) > -1)
                    .sort(specifierSort);
                let defaultSpec = actImport.defaultAlias || actImport.defaultPurposal;
                if (actImport.specifiers.length ||
                    (!!defaultSpec && this._parsedDocument.nonLocalUsages.indexOf(defaultSpec))) {
                    keep.push(actImport);
                }
            } else if (actImport instanceof TsStringImport) {
                keep.push(actImport);
            }
        }

        keep = [
            ...keep.filter(o => o instanceof TsStringImport).sort(importSort),
            ...keep.filter(o => !(o instanceof TsStringImport)).sort(importSort)
        ];

        this.imports = keep;

        return this;
    }

    /**
     * Does commit the currently virtual document to the TextEditor.
     * Returns a promise that resolves to a boolean if all changes
     * could be applied.
     * 
     * @returns {Promise<boolean>}
     * 
     * @memberOf ImportManager
     */
    public async commit(): Promise<boolean> {
        // Commit the documents imports:
        // 1. Remove imports that are in the document, but not anymore
        // 2. Update existing / insert new ones
        let edits = [];

        await this.resolveImportSpecifiers();

        if (this.organize) {
            for (let imp of this._parsedDocument.imports) {
                edits.push(TextEdit.delete(imp.getRange(this.document)));
            }
            edits.push(TextEdit.insert(
                getImportInsertPosition(ImportManager.config.resolver.newImportLocation, window.activeTextEditor),
                this.imports.reduce(
                    (all, cur) => all += cur.toImport(ImportManager.config.resolver.importOptions),
                    ''
                )
            ));
        } else {
            for (let imp of this._parsedDocument.imports) {
                if (!this.imports.some(o => o.libraryName === imp.libraryName)) {
                    edits.push(TextEdit.delete(imp.getRange(this.document)));
                }
            }
            let proxies = this._parsedDocument.imports.filter(o => o instanceof ImportProxy);
            for (let imp of this.imports) {
                if (imp instanceof ImportProxy &&
                    proxies.some((o: ImportProxy) => o.isEqual(imp as ImportProxy))) {
                    continue;
                }
                if (imp.start !== undefined && imp.end !== undefined) {
                    edits.push(TextEdit.replace(
                        imp.getRange(this.document),
                        imp.toImport(ImportManager.config.resolver.importOptions)
                    ));
                } else {
                    edits.push(TextEdit.insert(
                        getImportInsertPosition(
                            ImportManager.config.resolver.newImportLocation,
                            window.activeTextEditor
                        ),
                        imp.toImport(ImportManager.config.resolver.importOptions)
                    ));
                }
            }
        }

        // Later, more edits will come (like add methods to a class or so.) 

        let workspaceEdit = new WorkspaceEdit();
        workspaceEdit.set(this.document.uri, edits);
        let result = await workspace.applyEdit(workspaceEdit);
        if (result) {
            delete this.organize;
            this._parsedDocument = await ImportManager.parser.parseSource(this.document.getText());
        }

        return result;
    }

    /**
     * Solves conflicts in named specifiers and does ask the user for aliases. Also resolves namings for default
     * imports. As long as the user has a duplicate, he will be asked again.
     * 
     * @private
     * @returns {Promise<void>}
     * 
     * @memberOf ImportManager
     */
    private async resolveImportSpecifiers(): Promise<void> {
        let getSpecifiers = () => this.imports
            .reduce((all, cur) => {
                if (cur instanceof ImportProxy) {
                    all = all.concat(cur.specifiers.map(o => o.alias || o.specifier));
                    if (cur.defaultAlias) {
                        all.push(cur.defaultAlias);
                    }
                }
                if (cur instanceof TsAliasedImport) {
                    all.push(cur.alias);
                }
                return all;
            }, []) as string[];

        for (let decision of Object.keys(
            this.userImportDecisions
        ).filter(o => this.userImportDecisions[o].length > 0)) {
            let declarations: ResolveQuickPickItem[] = this.userImportDecisions[decision].map(
                o => new ResolveQuickPickItem(o)
            );

            let result = await window.showQuickPick(declarations, {
                placeHolder: `Multiple declarations for "${decision}" found.`
            });

            if (result) {
                this.addDeclarationImport(result.declarationInfo);
            }
        }

        let proxies = this.imports.filter(o => o instanceof ImportProxy) as ImportProxy[];

        for (let imp of proxies) {
            if (imp.defaultPurposal && !imp.defaultAlias) {
                imp.defaultAlias = await this.getDefaultIdentifier(imp.defaultPurposal);
                delete imp.defaultPurposal;
            }

            for (let spec of imp.specifiers) {
                let specifiers = getSpecifiers();
                if (specifiers.filter(o => o === (spec.alias || spec.specifier)).length > 1) {
                    spec.alias = await this.getSpecifierAlias();
                }
            }
        }
    }

    /**
     * Does resolve a duplicate specifier issue.
     * 
     * @private
     * @returns {Promise<string>}
     * 
     * @memberOf ImportManager
     */
    private async getSpecifierAlias(): Promise<string> {
        let result = await this.vscodeInputBox({
            placeHolder: 'Alias for specifier',
            prompt: 'Please enter an alias for the specifier..',
            validateInput: s => !!s ? '' : 'Please enter a variable name'
        });
        return !!result ? result : undefined;
    }

    /**
     * Calls the vscode input box to ask for an indentifier for a default export.
     * 
     * @private
     * @param {string} declarationName
     * @returns {Promise<string>}
     * 
     * @memberOf ImportManager
     */
    private async getDefaultIdentifier(declarationName: string): Promise<string> {
        let result = await this.vscodeInputBox({
            placeHolder: 'Default export name',
            prompt: 'Please enter a variable name for the default export..',
            validateInput: s => !!s ? '' : 'Please enter a variable name',
            value: declarationName
        });
        return !!result ? result : undefined;
    }

    /**
     * Ultimately asks the user for an input.
     * 
     * @private
     * @param {InputBoxOptions} options
     * @returns {Promise<string>}
     * 
     * @memberOf ImportManager
     */
    private async vscodeInputBox(options: InputBoxOptions): Promise<string> {
        return await window.showInputBox(options);
    }
}
