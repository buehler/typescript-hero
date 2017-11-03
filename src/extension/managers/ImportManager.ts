import {
    DeclarationIndex,
    DeclarationInfo,
    DefaultDeclaration,
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
import { ConfigFactory } from '../../common/factories';
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
import { importGroupSortForPrecedence, importSort, specifierSort } from '../utilities/utilityFunctions';
import { Logger } from '../utilities/winstonLogger';
import { ObjectManager } from './ObjectManager';

function sameSpecifiers(specs1: SymbolSpecifier[], specs2: SymbolSpecifier[]): boolean {
    for (const spec of specs1) {
        const spec2 = specs2[specs1.indexOf(spec)];
        if (!spec2 ||
            spec.specifier !== spec2.specifier ||
            spec.alias !== spec2.alias) {
            return false;
        }
    }
    return true;
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
        return Container.get<TypescriptParser>(iocSymbols.typescriptParser);
    }

    private static get config(): ConfigFactory {
        return Container.get<ConfigFactory>(iocSymbols.configuration);
    }

    private static get generator(): TypescriptCodeGenerator {
        return Container.get<() => TypescriptCodeGenerator>(iocSymbols.generatorFactory)();
    }

    private static get logger(): Logger {
        return Container.get(iocSymbols.logger);
    }

    private importGroups: ImportGroup[];
    private imports: Import[] = [];
    private userImportDecisions: { [usage: string]: DeclarationInfo[] }[] = [];
    private organize: boolean;

    private get config(): ExtensionConfig {
        return ImportManager.config(this.document.uri);
    }

    private get rootPath(): string | undefined {
        const rootFolder = workspace.getWorkspaceFolder(this.document.uri);
        return rootFolder ? rootFolder.uri.fsPath : undefined;
    }

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
        ImportManager.logger.debug(
            '[%s] create import manager',
            ImportManager.name,
            { file: document.fileName },
        );
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
        return new ImportManager(document, source);
    }

    /**
     * Resets the imports and the import groups back to the initial state of the parsed document.
     *
     * @memberof ImportManager
     */
    public reset(): void {
        this.imports = this._parsedDocument.imports.map(o => o.clone());
        this.importGroups = this.config.resolver.importGroups;
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
        ImportManager.logger.debug(
            '[%s] add declaration as import',
            ImportManager.name,
            { file: this.document.fileName, specifier: declarationInfo.declaration.name, library: declarationInfo.from },
        );
        // If there is something already imported, it must be a NamedImport
        const alreadyImported: NamedImport = this.imports.find(
            o => declarationInfo.from === getAbsolutLibraryName(
                o.libraryName,
                this.document.fileName,
                this.rootPath,
            ) && o instanceof NamedImport,
        ) as NamedImport;

        if (alreadyImported) {
            // If we found an import for this declaration, it's named import (with a possible default declaration)
            if (declarationInfo.declaration instanceof DefaultDeclaration) {
                delete alreadyImported.defaultAlias;
                alreadyImported.defaultAlias = declarationInfo.declaration.name;
            } else if (!alreadyImported.specifiers.some(o => o.specifier === declarationInfo.declaration.name)) {
                alreadyImported.specifiers.push(new SymbolSpecifier(declarationInfo.declaration.name));
            }
        } else {
            let imp: Import = new NamedImport(getRelativeLibraryName(
                declarationInfo.from,
                this.document.fileName,
                this.rootPath,
            ));

            if (declarationInfo.declaration instanceof ModuleDeclaration) {
                imp = new NamespaceImport(
                    declarationInfo.from,
                    declarationInfo.declaration.name,
                );
            } else if (declarationInfo.declaration instanceof DefaultDeclaration) {
                (imp as NamedImport).defaultAlias = declarationInfo.declaration.name;
            } else {
                (imp as NamedImport).specifiers.push(new SymbolSpecifier(declarationInfo.declaration.name));
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
        ImportManager.logger.debug(
            '[%s] add all missing imports',
            ImportManager.name,
            { file: this.document.fileName },
        );
        const declarations = getDeclarationsFilteredByImports(
            index.declarationInfos,
            this.document.fileName,
            this.imports,
            this.rootPath,
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
        ImportManager.logger.debug(
            '[%s] organize the imports',
            ImportManager.name,
            { file: this.document.fileName },
        );
        this.organize = true;
        let keep: Import[] = [];

        if (this.config.resolver.disableImportRemovalOnOrganize) {
            keep = this.imports;
        } else {
            for (const actImport of this.imports) {
                if (this.config.resolver.ignoreImportsForOrganize.indexOf(actImport.libraryName) >= 0) {
                    keep.push(actImport);
                    continue;
                }
                if (actImport instanceof NamespaceImport ||
                    actImport instanceof ExternalModuleImport) {
                    if (this._parsedDocument.nonLocalUsages.indexOf(actImport.alias) > -1) {
                        keep.push(actImport);
                    }
                } else if (actImport instanceof NamedImport) {
                    actImport.specifiers = actImport.specifiers
                        .filter(o => this._parsedDocument.nonLocalUsages.indexOf(o.alias || o.specifier) > -1)
                        .sort(specifierSort);
                    const defaultSpec = actImport.defaultAlias;
                    if (actImport.specifiers.length ||
                        (!!defaultSpec && this._parsedDocument.nonLocalUsages.indexOf(defaultSpec) >= 0)) {
                        keep.push(actImport);
                    }
                } else if (actImport instanceof StringImport) {
                    keep.push(actImport);
                }
            }
        }

        if (!this.config.resolver.disableImportSorting) {
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

        ImportManager.logger.debug(
            '[%s] commit the file',
            ImportManager.name,
            { file: this.document.fileName },
        );

        const result = await workspace.applyEdit(workspaceEdit);

        if (result) {
            delete this.organize;
            this._parsedDocument = await ImportManager.parser.parseSource(this.document.getText());
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
            const actualDocumentsNamed = this._parsedDocument.imports.filter(o => o instanceof NamedImport);
            for (const imp of this.imports) {
                if (imp instanceof NamedImport &&
                    actualDocumentsNamed.some((o: NamedImport) =>
                        o.libraryName === imp.libraryName &&
                        o.defaultAlias === imp.defaultAlias &&
                        o.specifiers.length === imp.specifiers.length &&
                        sameSpecifiers(o.specifiers, imp.specifiers))) {
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
        const importGroupsWithPrecedence = importGroupSortForPrecedence(this.importGroups);
        for (const tsImport of imports) {
            for (const group of importGroupsWithPrecedence) {
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
                if (cur instanceof NamedImport) {
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
            [] as string[],
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

        const named = this.imports.filter(o => o instanceof NamedImport) as NamedImport[];

        for (const imp of named) {
            if (imp.defaultAlias) {
                const specifiers = getSpecifiers();
                if (
                    specifiers.filter(o => o === imp.defaultAlias).length > 1 &&
                    this.config.resolver.promptForSpecifiers
                ) {
                    imp.defaultAlias = await this.getDefaultIdentifier(imp.defaultAlias);
                }
            }

            for (const spec of imp.specifiers) {
                const specifiers = getSpecifiers();
                if (
                    specifiers.filter(o => o === (spec.alias || spec.specifier)).length > 1 &&
                    this.config.resolver.promptForSpecifiers
                ) {
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
        const result = await this.vscodeInputBox({
            placeHolder: 'Default export name',
            prompt: 'Please enter an alias name for the default export...',
            validateInput: s => !!s ? '' : 'Please enter a variable name',
            value: declarationName,
        });
        return !!result ? result.replace(/[,.-_]/g, '') : undefined;
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
