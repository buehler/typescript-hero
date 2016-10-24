import { DeclarationInfo } from '../caches/ResolveIndex';
import { ExtensionConfig } from '../ExtensionConfig';
import { InjectorDecorators } from '../IoC';
import { DefaultDeclaration, ModuleDeclaration, TsDeclaration } from '../models/TsDeclaration';
import { TsAliasedImport, TsDefaultImport, TsNamedImport, TsNamespaceImport } from '../models/TsImport';
import { TsResolveSpecifier } from '../models/TsResolveSpecifier';
import { TsFile } from '../models/TsResource';
import { TsResourceParser } from '../parser/TsResourceParser';
import {
    getAbsolutLibraryName,
    getImportInsertPosition,
    getRelativeLibraryName
} from '../utilities/ResolveIndexExtensions';
import { TextDocument, TextEdit, window, workspace, WorkspaceEdit } from 'vscode';

/**
 * Management class for a TextDocument. Can add and remove parts of the document
 * and commit the virtual document to the TextEditor.
 * 
 * @export
 * @class DocumentController
 */
export class DocumentController {
    @InjectorDecorators.lazyInject(TsResourceParser)
    private static parser: TsResourceParser;

    @InjectorDecorators.lazyInject(ExtensionConfig)
    private static config: ExtensionConfig;

    private edits: (TextEdit | Promise<TextEdit>)[] = [];

    /**
     * Indicates if there are pending / uncommited edits.
     * 
     * @readonly
     * @type {boolean}
     * @memberOf DocumentController
     */
    public get isDirty(): boolean {
        return this.edits.length >= 0;
    }

    private constructor(private readonly document: TextDocument, private parsedDocument: TsFile) { }

    /**
     * Creates an instance of a DocumentController.
     * Does parse the document text first and returns a promise that
     * resolves to a DocumentController.
     * 
     * @static
     * @param {TextDocument} document - The document that should be managed
     * @returns {Promise<DocumentController>}
     * 
     * @memberOf DocumentController
     */
    public static async create(document: TextDocument): Promise<DocumentController> {
        let source = await DocumentController.parser.parseSource(document.getText());
        return new DocumentController(document, source);
    }

    /**
     * Adds an import for a declaration to the document.
     * If it's a default import or there is a duplicate identifier, the controller will ask for the name on commit().
     * 
     * @param {TsImport} imp - The import that should be added to the document
     * @returns {DocumentController} - The controller instance
     * 
     * @memberOf DocumentController
     */
    public addDeclarationImport(declarationInfo: DeclarationInfo): this {
        let alreadyImported = this.parsedDocument.imports.find(o => {
            let lib = getAbsolutLibraryName(o.libraryName, this.document.fileName);
            return lib === declarationInfo.from && !(o instanceof TsDefaultImport);
        });

        let specifiers = this.parsedDocument.imports.reduce((all, cur) => {
            if (cur instanceof TsNamedImport) {
                return all.concat(cur.specifiers.map(o => o.alias || o.specifier));
            }
            if (cur instanceof TsAliasedImport) {
                all.push(cur.alias);
            }
            return all;
        }, []);

        let duplicateSpecifierFound = !this.isAbstractDeclaration(declarationInfo.declaration) &&
            specifiers.some(o => o === declarationInfo.declaration.name);

        if (!alreadyImported) {
            let newImport;

            if (!(duplicateSpecifierFound || this.isAbstractDeclaration(declarationInfo.declaration))) {
                newImport = new TsNamedImport(getRelativeLibraryName(
                    declarationInfo.from,
                    this.document.fileName
                ));
                newImport.specifiers.push(new TsResolveSpecifier(declarationInfo.declaration.name));
            } else if (declarationInfo.declaration instanceof ModuleDeclaration) {
                newImport = new TsNamespaceImport(
                    declarationInfo.from,
                    declarationInfo.declaration.name
                );
            }

            this.parsedDocument.imports.push(newImport);
            this.edits.push(TextEdit.insert(
                getImportInsertPosition(DocumentController.config.resolver.newImportLocation, window.activeTextEditor),
                newImport.toImport(DocumentController.config.resolver.importOptions)
            ));
        }

        return this;
    }

    /**
     * Organizes the imports of the document. Orders all imports and removes unused imports.
     * Order:
     * 1. string-only imports (e.g. import 'reflect-metadata')
     * 2. rest, but in alphabetical order
     * 
     * @returns {DocumentController} - The controller instance
     * 
     * @memberOf DocumentController
     */
    public organizeImports(): this {
        return this;
    }

    /**
     * Does commit the currently virtual document to the TextEditor.
     * Returns a promise that resolves to a boolean if all changes
     * could be applied.
     * 
     * @returns {Promise<boolean>}
     * 
     * @memberOf DocumentController
     */
    public async commit(): Promise<boolean> {
        if (!this.isDirty) {
            return Promise.resolve(true);
        }

        let edits = await Promise.all(this.edits),
            workspaceEdit = new WorkspaceEdit();
        workspaceEdit.set(this.document.uri, edits);
        let result = await workspace.applyEdit(workspaceEdit);
        if (result) {
            this.edits = [];
        }

        return result;
    }

    private isAbstractDeclaration(declaration: TsDeclaration): boolean {
        return declaration instanceof ModuleDeclaration || declaration instanceof DefaultDeclaration;
    }
}
