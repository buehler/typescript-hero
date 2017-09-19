import {
    DeclarationIndex,
    DeclarationInfo,
    DefaultDeclaration,
    DefaultImport,
    ExternalModuleImport,
    File,
    Import,
    isAliasedImport,
    ModuleDeclaration,
    NamedImport,
    NamespaceImport,
    StringImport,
    SymbolSpecifier,
    TypescriptCodeGenerator,
    TypescriptParser,
} from 'typescript-parser';
import { InputBoxOptions, Range, TextDocument, TextEdit, window, workspace, WorkspaceEdit } from 'vscode';

import { ExtensionConfig } from '../../common/config';
import {
    getAbsolutLibraryName,
    getDeclarationsFilteredByImports,
    getImportInsertPosition,
    getRelativeLibraryName,
} from '../../common/helpers';
import { ResolveQuickPickItem } from '../../common/quick-pick-items';
import { importRange } from '../helpers';
import { ImportGroup } from '../import-grouping';
import { Container } from '../IoC';
import { iocSymbols } from '../IoCSymbols';
import { ImportProxy } from '../proxy-objects/ImportProxy';
import { importSort, specifierSort } from '../utilities/utilityFunctions';
import { ObjectManager } from './ObjectManager';

/**
 * Management class for the imports of a document. Can add and remove imports to the document
 * and commit the virtual document to the TextEditor.
 *
 * @export
 * @class ImportManager
 */
export class ImportManager implements ObjectManager {
    private static get parser(): TypescriptParser {
        return Container.get<TypescriptParser>(iocSymbols.typescriptParser);
    }

    private static get config(): ExtensionConfig {
        return Container.get<ExtensionConfig>(iocSymbols.configuration);
    }

    private static get generator(): TypescriptCodeGenerator {
        return Container.get<() => TypescriptCodeGenerator>(iocSymbols.generatorFactory)();
    }

    private static get rootPath(): string {
        return Container.get<string>(iocSymbols.rootPath);
    }

    private importGroups: ImportGroup[];
    private imports: Import[] = [];
    private userImportDecisions: { [usage: string]: DeclarationInfo[] }[] = [];
    private organize: boolean;

    /**
     * Document resource for this controller. Contains the parsed document.
     *
     * @readonly
     * @type {File}
     * @memberof ImportManager
     */
    public get parsedDocument(): File {
        return this._parsedDocument;
    }

    private constructor(
        public readonly document: TextDocument,
        private _parsedDocument: File,
    ) {
        this.reset();
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
     * @memberof ImportManager
     */
    public static async create(document: TextDocument): Promise<ImportManager> {
        const source = await ImportManager.parser.parseSource(document.getText());
        source.imports = source.imports.map(
            o => o instanceof NamedImport || o instanceof DefaultImport ? new ImportProxy(o) : o,
        );
        return new ImportManager(document, source);
    }

    /**
     * Resets the imports and the import groups back to the initial state of the parsed document.
     *
     * @memberof ImportManager
     */
    public reset(): void {
        this.imports = this._parsedDocument.imports.map(o => o.clone());
        this.importGroups = ImportManager.config.resolver.importGroups;
        this.addImportsToGroups(this.imports);
    }

    /**
     * Adds an import for a declaration to the documents imports.
     * This index is merged and commited during the commit() function.
     * If it's a default import or there is a duplicate identifier, the controller will ask for the name on commit().
     *
     * @param {DeclarationInfo} declarationInfo The import that should be added to the document
     * @returns {ImportManager}
     *
     * @memberof ImportManager
     */
    public addDeclarationImport(declarationInfo: DeclarationInfo): this {
        // If there is something already imported, it must be a NamedImport or a DefaultImport
        const alreadyImported: ImportProxy = this.imports.find(
            o => declarationInfo.from === getAbsolutLibraryName(
                o.libraryName,
                this.document.fileName,
                ImportManager.rootPath,
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
            let imp: Import;
            if (declarationInfo.declaration instanceof ModuleDeclaration) {
                imp = new NamespaceImport(
                    declarationInfo.from,
                    declarationInfo.declaration.name,
                );
            } else if (declarationInfo.declaration instanceof DefaultDeclaration) {
                imp = new ImportProxy(getRelativeLibraryName(
                    declarationInfo.from,
                    this.document.fileName,
                    ImportManager.rootPath,
                ));
                (imp as ImportProxy).defaultPurposal = declarationInfo.declaration.name;
            } else {
                imp = new ImportProxy(getRelativeLibraryName(
                    declarationInfo.from,
                    this.document.fileName,
                    ImportManager.rootPath,
                ));
                (imp as ImportProxy).specifiers.push(new SymbolSpecifier(declarationInfo.declaration.name));
            }
            this.imports.push(imp);
            this.addImportsToGroups([imp]);
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
     * @memberof ImportManager
     */
    public addMissingImports(index: DeclarationIndex): this {
        const declarations = getDeclarationsFilteredByImports(
            index.declarationInfos,
            this.document.fileName,
            this.imports,
            ImportManager.rootPath,
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
     * @memberof ImportManager
     */
    public organizeImports(): this {
        this.organize = true;
        let keep: Import[] = [];

        for (const actImport of this.imports) {
            if (ImportManager.config.resolver.ignoreImportsForOrganize.indexOf(actImport.libraryName) >= 0) {
                keep.push(actImport);
                continue;
            }
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
                    (!!defaultSpec && this._parsedDocument.nonLocalUsages.indexOf(defaultSpec) >= 0)) {
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

        for (const group of this.importGroups) {
            group.reset();
        }
        this.imports = keep;
        this.addImportsToGroups(this.imports);

        return this;
    }

    /**
     * Does commit the currently virtual document to the TextEditor.
     * Returns a promise that resolves to a boolean if all changes
     * could be applied.
     *
     * @returns {Promise<boolean>}
     *
     * @memberof ImportManager
     */
    public async commit(): Promise<boolean> {
        await this.resolveImportSpecifiers();

        const edits: TextEdit[] = this.calculateTextEdits();
        const workspaceEdit = new WorkspaceEdit();

        workspaceEdit.set(this.document.uri, edits);

        const result = await workspace.applyEdit(workspaceEdit);

        if (result) {
            delete this.organize;
            this._parsedDocument = await ImportManager.parser.parseSource(this.document.getText());
            this._parsedDocument.imports = this._parsedDocument.imports.map(
                o => o instanceof NamedImport || o instanceof DefaultImport ? new ImportProxy(o) : o,
            );
            this.imports = this._parsedDocument.imports.map(o => o.clone());
            for (const group of this.importGroups) {
                group.reset();
            }
            this.addImportsToGroups(this.imports);
        }

        return result;
    }

    /**
     * Calculate the needed {@link TextEdit} array for the actual changes in the imports.
     *
     * @returns {TextEdit[]}
     *
     * @memberof ImportManager
     */
    public calculateTextEdits(): TextEdit[] {
        const edits: TextEdit[] = [];

        if (this.organize) {
            // since the imports should be organized:
            // delete all imports and the following lines (if empty)
            // newly generate all groups.
            for (const imp of this._parsedDocument.imports) {
                edits.push(TextEdit.delete(importRange(this.document, imp.start, imp.end)));
                if (imp.end !== undefined) {
                    const nextLine = this.document.lineAt(this.document.positionAt(imp.end).line + 1);
                    if (nextLine.text === '') {
                        edits.push(TextEdit.delete(nextLine.rangeIncludingLineBreak));
                    }
                }
            }
            const imports = this.importGroups
                .map(group => ImportManager.generator.generate(group as any))
                .filter(Boolean)
                .join('\n');
            if (!!imports) {
                edits.push(TextEdit.insert(
                    getImportInsertPosition(window.activeTextEditor),
                    `${imports}\n`,
                ));
            }
        } else {
            // Commit the documents imports:
            // 1. Remove imports that are in the document, but not anymore
            // 2. Update existing / insert new ones
            for (const imp of this._parsedDocument.imports) {
                if (!this.imports.some(o => o.libraryName === imp.libraryName)) {
                    edits.push(TextEdit.delete(importRange(this.document, imp.start, imp.end)));
                }
            }
            const actualDocumentsProxies = this._parsedDocument.imports.filter(o => o instanceof ImportProxy);
            for (const imp of this.imports) {
                if (imp instanceof ImportProxy &&
                    actualDocumentsProxies.some((o: ImportProxy) => o.isEqual(imp as ImportProxy))) {
                    continue;
                }
                if (imp.isNew) {
                    edits.push(TextEdit.insert(
                        getImportInsertPosition(
                            window.activeTextEditor,
                        ),
                        ImportManager.generator.generate(imp) + '\n',
                    ));
                } else {
                    edits.push(TextEdit.replace(
                        new Range(
                            this.document.positionAt(imp.start!),
                            this.document.positionAt(imp.end!),
                        ),
                        ImportManager.generator.generate(imp),
                    ));
                }
            }
        }

        return edits;
    }

    /**
     * Add a list of imports to the groups of the ImportManager.
     *
     * @private
     * @param {Import[]} imports
     *
     * @memberof ImportManager
     */
    private addImportsToGroups(imports: Import[]): void {
        for (const tsImport of imports) {
            for (const group of this.importGroups) {
                if (group.processImport(tsImport)) {
                    break;
                }
            }
        }
    }

    /**
     * Solves conflicts in named specifiers and does ask the user for aliases. Also resolves namings for default
     * imports. As long as the user has a duplicate, he will be asked again.
     *
     * @private
     * @returns {Promise<void>}
     *
     * @memberof ImportManager
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
                    spec.alias = await this.getSpecifierAlias(spec.alias || spec.specifier);
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
     * @memberof ImportManager
     */
    private async getSpecifierAlias(specifierName: string): Promise<string | undefined> {
        if (!ImportManager.config.resolver.promptForSpecifiers) {
            return specifierName;
        }
        const result = await this.vscodeInputBox({
            placeHolder: `Alias for specifier "${specifierName}"`,
            prompt: `Please enter an alias for the specifier "${specifierName}"...`,
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
     * @memberof ImportManager
     */
    private async getDefaultIdentifier(declarationName: string): Promise<string | undefined> {
        if (!ImportManager.config.resolver.promptForSpecifiers) {
            return declarationName;
        }
        const result = await this.vscodeInputBox({
            placeHolder: 'Default export name',
            prompt: 'Please enter a variable name for the default export...',
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
     * @returns {Promise<string | undefined>}
     *
     * @memberof ImportManager
     */
    private async vscodeInputBox(options: InputBoxOptions): Promise<string | undefined> {
        return await window.showInputBox(options);
    }
}
