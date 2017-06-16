import { ExtensionContext, TreeItemCollapsibleState } from 'vscode';

import {
    DefaultImport,
    ExternalModuleImport,
    Import,
    NamedImport,
    NamespaceImport,
    StringImport,
} from '../../../common/ts-parsing/imports';
import { File } from '../../../common/ts-parsing/resources';
import { BaseStructureTreeItem } from './BaseStructureTreeItem';

/**
 * Import specifier tree item that represents a specific (named) import of an import statement.
 * 
 * @export
 * @class ImportSpecifierStructureTreeItem
 * @extends {BaseStructureTreeItem}
 */
export class ImportSpecifierStructureTreeItem extends BaseStructureTreeItem {
    constructor(name: string, tsImport: Import, context: ExtensionContext) {
        super(name);
        this.iconPath = context.asAbsolutePath('./src/extension/assets/icons/declarations/default.svg');
        this.command = this.createJumpToCommand([tsImport]);
    }
}

/**
 * Structure item that represents an import in a file.
 * 
 * @export
 * @class ImportStructureTreeItem
 * @extends {BaseStructureTreeItem}
 */
export class ImportStructureTreeItem extends BaseStructureTreeItem {
    constructor(private tsImport: Import, private context: ExtensionContext) {
        super(tsImport.libraryName);
        this.iconPath = context.asAbsolutePath('./src/extension/assets/icons/declarations/import.svg');
        this.command = this.createJumpToCommand([tsImport]);

        if (!(tsImport instanceof StringImport)) {
            this.collapsibleState = TreeItemCollapsibleState.Collapsed;
        }
    }

    public getChildren(): BaseStructureTreeItem[] {
        const imp = this.tsImport;
        if (imp instanceof DefaultImport) {
            return [new ImportSpecifierStructureTreeItem(imp.alias, imp, this.context)];
        } else if (imp instanceof ExternalModuleImport) {
            return [new ImportSpecifierStructureTreeItem(imp.alias, imp, this.context)];
        } else if (imp instanceof NamedImport) {
            return imp.specifiers.map(
                s => new ImportSpecifierStructureTreeItem(
                    `${s.specifier}${s.alias ? ` as ${s.alias}` : ''}`,
                    imp,
                    this.context,
                ),
            );
        } else if (imp instanceof NamespaceImport) {
            return [new ImportSpecifierStructureTreeItem(imp.alias, imp, this.context)];
        }
        return [];
    }
}

/**
 * Structure item that contains all imports from the file.
 * Collapsed by default.
 * 
 * @export
 * @class ImportsStructureTreeItem
 * @extends {BaseStructureTreeItem}
 */
export class ImportsStructureTreeItem extends BaseStructureTreeItem {
    constructor(private file: File, private context: ExtensionContext) {
        super('Imports');
        this.collapsibleState = TreeItemCollapsibleState.Collapsed;
        this.iconPath = context.asAbsolutePath('./src/extension/assets/icons/declarations/module.svg');
    }

    public getChildren(): BaseStructureTreeItem[] {
        return this.file.imports.map(i => new ImportStructureTreeItem(i, this.context));
    }
}
