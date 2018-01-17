import {
    ExternalModuleImport,
    File,
    Import,
    NamedImport,
    NamespaceImport,
    StringImport,
    SymbolSpecifier,
    TypescriptCodeGenerator,
    TypescriptParser,
} from 'typescript-parser';
import { Position, Range, TextDocument, TextEdit, window, workspace, WorkspaceEdit } from 'vscode';

import Configuration from '../configuration/index';
import { TypescriptCodeGeneratorFactory } from '../ioc-symbols';
import { Logger } from '../utilities/Logger';
import {
    getImportInsertPosition,
    getScriptKind,
    importGroupSortForPrecedence,
    importSort,
    importSortByFirstSpecifier,
    specifierSort,
} from '../utilities/utilityFunctions';
import { ImportGroup } from './import-grouping';

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
 * Function that calculates the range object for an import.
 *
 * @export
 * @param {TextDocument} document
 * @param {number} [start]
 * @param {number} [end]
 * @returns {Range}
 */
export function importRange(document: TextDocument, start?: number, end?: number): Range {
  return start !== undefined && end !== undefined ?
    new Range(
      document.lineAt(document.positionAt(start).line).rangeIncludingLineBreak.start,
      document.lineAt(document.positionAt(end).line).rangeIncludingLineBreak.end,
    ) :
    new Range(new Position(0, 0), new Position(0, 0));
}

/**
 * Management class for the imports of a document. Can add and remove imports to the document
 * and commit the virtual document to the TextEditor.
 *
 * @export
 * @class ImportManager
 */
export default class ImportManager {
  private importGroups: ImportGroup[];
  private imports: Import[] = [];
  private organize: boolean;

  private get rootPath(): string | undefined {
    const rootFolder = workspace.getWorkspaceFolder(this.document.uri);
    return rootFolder ? rootFolder.uri.fsPath : undefined;
  }

  private get generator(): TypescriptCodeGenerator {
    return this.generatorFactory(this.document.uri);
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

  public constructor(
    public readonly document: TextDocument,
    private _parsedDocument: File,
    private readonly parser: TypescriptParser,
    private readonly config: Configuration,
    private readonly logger: Logger,
    private readonly generatorFactory: TypescriptCodeGeneratorFactory,
  ) {
    this.logger.debug(
      `[ImportManager] create import manager`,
      { file: document.fileName },
    );
    this.reset();
  }

  /**
   * Resets the imports and the import groups back to the initial state of the parsed document.
   *
   * @memberof ImportManager
   */
  public reset(): void {
    this.imports = this._parsedDocument.imports.map(o => o.clone());
    this.importGroups = this.config.imports.grouping(this.document.uri);
    this.addImportsToGroups(this.imports);
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
    this.logger.debug(
      '[ImportManager] organize the imports',
      { file: this.document.fileName },
    );
    this.organize = true;
    let keep: Import[] = [];

    if (this.config.imports.disableImportRemovalOnOrganize(this.document.uri)) {
      keep = this.imports;
    } else {
      for (const actImport of this.imports) {
        if (this.config.imports.ignoredFromRemoval(this.document.uri).indexOf(actImport.libraryName) >= 0) {
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

    if (!this.config.imports.disableImportRemovalOnOrganize(this.document.uri)) {
      const sorter = this.config.imports.organizeSortsByFirstSpecifier(this.document.uri)
        ? importSortByFirstSpecifier
        : importSort;

      keep = [
        ...keep.filter(o => o instanceof StringImport).sort(sorter),
        ...keep.filter(o => !(o instanceof StringImport)).sort(sorter),
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
    const edits: TextEdit[] = this.calculateTextEdits();
    const workspaceEdit = new WorkspaceEdit();

    workspaceEdit.set(this.document.uri, edits);

    this.logger.debug(
      '[ImportManager] commit the file',
      { file: this.document.fileName },
    );

    const result = await workspace.applyEdit(workspaceEdit);

    if (result) {
      delete this.organize;
      this._parsedDocument = await this.parser.parseSource(
        this.document.getText(),
        getScriptKind(this.document.fileName),
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
        .map(group => this.generator.generate(group as any))
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
            this.generator.generate(imp) + '\n',
          ));
        } else {
          edits.push(TextEdit.replace(
            new Range(
              this.document.positionAt(imp.start!),
              this.document.positionAt(imp.end!),
            ),
            this.generator.generate(imp),
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
}
