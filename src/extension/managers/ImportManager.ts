import { ExtensionConfig } from '../../common/config';
import {
    getAbsolutLibraryName,
    getDeclarationsFilteredByImports,
    getImportInsertPosition,
    getRelativeLibraryName,
} from '../../common/helpers';
import { ResolveQuickPickItem } from '../../common/quick-pick-items';
import { SymbolSpecifier, TypescriptParser } from '../../common/ts-parsing';
import { DeclarationInfo, DefaultDeclaration, ModuleDeclaration } from '../../common/ts-parsing/declarations';
import {
    DefaultImport,
    ExternalModuleImport,
    Import,
    NamedImport,
    NamespaceImport,
    StringImport,
} from '../../common/ts-parsing/imports';
import { File } from '../../common/ts-parsing/resources';
import { isAliasedImport } from '../../common/type-guards/TypescriptHeroGuards';
import { DeclarationIndex } from '../../server/indices/DeclarationIndex';
import { CalculatedDeclarationIndex } from '../declarations/CalculatedDeclarationIndex';
import { importRange } from '../helpers';
import { Container } from '../IoC';
import { iocSymbols } from '../IoCSymbols';
import { ImportProxy } from '../proxy-objects/ImportProxy';
import { ObjectManager } from './ObjectManager';
import { InputBoxOptions, TextDocument, TextEdit as CodeTextEdit, window, workspace, WorkspaceEdit } from 'vscode';
import { TextEdit } from 'vscode-languageserver-types';

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
 * @param {Import} i1
 * @param {TsImport} i2
 * @returns {number}
 */
function importSort(i1: Import, i2: Import): number {
    const strA = i1.libraryName.toLowerCase();
    const strB = i2.libraryName.toLowerCase();

    return stringSort(strA, strB);
}

/**
 * Order specifiers by name.
 * 
 * @param {SymbolSpecifier} i1
 * @param {SymbolSpecifier} i2
 * @returns {number}
 */
function specifierSort(i1: SymbolSpecifier, i2: SymbolSpecifier): number {
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
    private static get parser(): TypescriptParser {
        return Container.get(TypescriptParser);
    }

    private static get config(): ExtensionConfig {
        return Container.get<ExtensionConfig>(iocSymbols.configuration);
    }

    private imports: Import[] = [];
    private userImportDecisions: { [usage: string]: DeclarationInfo[] }[] = [];
    private organize: boolean;

    /**
     * Document resource for this controller. Contains the parsed document.
     * 
     * @readonly
     * @type {File}
     * @memberOf ImportManager
     */
    public get parsedDocument(): File {
        return this._parsedDocument;
    }

    private constructor(
        public readonly document: TextDocument,
        private _parsedDocument: File,
    ) {
        this.imports = _parsedDocument.imports.map(o => o.clone<Import>());
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
        const source = await ImportManager.parser.parseSource(document.getText());
        source.imports = source.imports.map(
            o => o instanceof NamedImport || o instanceof DefaultImport ? new ImportProxy(o) : o,
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
        const alreadyImported: ImportProxy = this.imports.find(
            o => declarationInfo.from === getAbsolutLibraryName(
                o.libraryName,
                this.document.fileName,
                workspace.rootPath,
            ) && o instanceof ImportProxy,
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
                this.imports.push(new NamespaceImport(
                    declarationInfo.from,
                    declarationInfo.declaration.name,
                ));
            } else if (declarationInfo.declaration instanceof DefaultDeclaration) {
                const imp = new ImportProxy(getRelativeLibraryName(
                    declarationInfo.from,
                    this.document.fileName,
                    workspace.rootPath,
                ));
                imp.defaultPurposal = declarationInfo.declaration.name;
                this.imports.push(imp);
            } else {
                const imp = new ImportProxy(getRelativeLibraryName(
                    declarationInfo.from,
                    this.document.fileName,
                    workspace.rootPath,
                ));
                imp.specifiers.push(new SymbolSpecifier(declarationInfo.declaration.name));
                this.imports.push(imp);
            }
        }

        return this;
    }

    /**
     * Adds all missing imports to the actual document. If multiple declarations are found for one missing
     * specifier, the user is asked when the commit() function is executed.
     * 
     * @param {DeclarationIndex} index
     * @returns {this}
     * 
     * @memberOf ImportManager
     */
    public addMissingImports(index: DeclarationIndex | CalculatedDeclarationIndex): this {
        const declarations = getDeclarationsFilteredByImports(
            index.declarationInfos,
            this.document.fileName,
            workspace.rootPath,
            this.imports,
        );

        for (const usage of this._parsedDocument.nonLocalUsages) {
            const foundDeclarations = declarations.filter(o => o.declaration.name === usage);
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
        let keep: Import[] = [];

        for (const actImport of this.imports) {
            if (actImport instanceof NamespaceImport ||
                actImport instanceof ExternalModuleImport) {
                if (this._parsedDocument.nonLocalUsages.indexOf(actImport.alias) > -1) {
                    keep.push(actImport);
                }
            } else if (actImport instanceof ImportProxy) {
                actImport.specifiers = actImport.specifiers
                    .filter(o => this._parsedDocument.nonLocalUsages.indexOf(o.alias || o.specifier) > -1)
                    .sort(specifierSort);
                const defaultSpec = actImport.defaultAlias || actImport.defaultPurposal;
                if (actImport.specifiers.length ||
                    (!!defaultSpec && this._parsedDocument.nonLocalUsages.indexOf(defaultSpec))) {
                    keep.push(actImport);
                }
            } else if (actImport instanceof StringImport) {
                keep.push(actImport);
            }
        }

        if (!ImportManager.config.resolver.disableImportSorting) {
            keep = [
                ...keep.filter(o => o instanceof StringImport).sort(importSort),
                ...keep.filter(o => !(o instanceof StringImport)).sort(importSort),
            ];
        }

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
        const edits: TextEdit[] = [];

        await this.resolveImportSpecifiers();

        if (this.organize) {
            for (const imp of this._parsedDocument.imports) {
                edits.push(TextEdit.del(importRange(this.document, imp.start, imp.end)));
            }
            edits.push(TextEdit.insert(
                getImportInsertPosition(ImportManager.config.resolver.newImportLocation, window.activeTextEditor),
                this.imports.reduce(
                    (all, cur) => all + cur.generateTypescript(ImportManager.config.resolver.generationOptions),
                    '',
                ),
            ));
        } else {
            for (const imp of this._parsedDocument.imports) {
                if (!this.imports.some(o => o.libraryName === imp.libraryName)) {
                    edits.push(TextEdit.del(importRange(this.document, imp.start, imp.end)));
                }
            }
            const proxies = this._parsedDocument.imports.filter(o => o instanceof ImportProxy);
            for (const imp of this.imports) {
                if (imp instanceof ImportProxy &&
                    proxies.some((o: ImportProxy) => o.isEqual(imp as ImportProxy))) {
                    continue;
                }
                if (imp.start !== undefined && imp.end !== undefined) {
                    edits.push(TextEdit.replace(
                        importRange(this.document, imp.start, imp.end),
                        imp.generateTypescript(ImportManager.config.resolver.generationOptions),
                    ));
                } else {
                    edits.push(TextEdit.insert(
                        getImportInsertPosition(
                            ImportManager.config.resolver.newImportLocation,
                            window.activeTextEditor,
                        ),
                        imp.generateTypescript(ImportManager.config.resolver.generationOptions),
                    ));
                }
            }
        }

        // Later, more edits will come (like add methods to a class or so.) 

        const workspaceEdit = new WorkspaceEdit();
        workspaceEdit.set(this.document.uri, <CodeTextEdit[]>edits);
        const result = await workspace.applyEdit(workspaceEdit);
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
        const getSpecifiers = () => this.imports
            .reduce(
            (all, cur) => {
                let specifiers = all;
                if (cur instanceof ImportProxy) {
                    specifiers = specifiers.concat(cur.specifiers.map(o => o.alias || o.specifier));
                    if (cur.defaultAlias) {
                        specifiers.push(cur.defaultAlias);
                    }
                }
                if (isAliasedImport(cur)) {
                    specifiers.push(cur.alias);
                }
                return specifiers;
            },
            <string[]>[],
        );

        for (const decision of Object.keys(
            this.userImportDecisions,
        ).filter(o => this.userImportDecisions[o].length > 0)) {
            const declarations: ResolveQuickPickItem[] = this.userImportDecisions[decision].map(
                o => new ResolveQuickPickItem(o),
            );

            const result = await window.showQuickPick(declarations, {
                placeHolder: `Multiple declarations for "${decision}" found.`,
            });

            if (result) {
                this.addDeclarationImport(result.declarationInfo);
            }
        }

        const proxies = this.imports.filter(o => o instanceof ImportProxy) as ImportProxy[];

        for (const imp of proxies) {
            if (imp.defaultPurposal && !imp.defaultAlias) {
                imp.defaultAlias = await this.getDefaultIdentifier(imp.defaultPurposal);
                delete imp.defaultPurposal;
            }

            for (const spec of imp.specifiers) {
                const specifiers = getSpecifiers();
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
     * @returns {Promise<string | undefined>}
     * 
     * @memberOf ImportManager
     */
    private async getSpecifierAlias(): Promise<string | undefined> {
        const result = await this.vscodeInputBox({
            placeHolder: 'Alias for specifier',
            prompt: 'Please enter an alias for the specifier..',
            validateInput: s => !!s ? '' : 'Please enter a variable name',
        });
        return !!result ? result : undefined;
    }

    /**
     * Calls the vscode input box to ask for an indentifier for a default export.
     * 
     * @private
     * @param {string} declarationName
     * @returns {Promise<string | undefined>}
     * 
     * @memberOf ImportManager
     */
    private async getDefaultIdentifier(declarationName: string): Promise<string | undefined> {
        const result = await this.vscodeInputBox({
            placeHolder: 'Default export name',
            prompt: 'Please enter a variable name for the default export..',
            validateInput: s => !!s ? '' : 'Please enter a variable name',
            value: declarationName,
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
