import {TsExport} from './TsExport';
import {TsImport} from './TsImport';
import {TsResolveInformation} from './TsResolveInformation';
import {CompletionItemKind} from 'vscode';

export abstract class TsDeclaration {
    constructor(public name: string) { }

    public abstract getItemKind(): CompletionItemKind;
}

export abstract class TsExportableDeclaration extends TsDeclaration {
    constructor(name: string, public isExported: boolean) {
        super(name);
    }
}

export class TsClassDeclaration extends TsExportableDeclaration {
    public getItemKind(): CompletionItemKind {
        return CompletionItemKind.Class;
    }
}

export class TsFunctionDeclaration extends TsExportableDeclaration {
    public getItemKind(): CompletionItemKind {
        return CompletionItemKind.Function;
    }
}

export class TsEnumDeclaration extends TsExportableDeclaration {
    public getItemKind(): CompletionItemKind {
        return CompletionItemKind.Enum;
    }
}

export class TsTypeDeclaration extends TsExportableDeclaration {
    public getItemKind(): CompletionItemKind {
        return CompletionItemKind.Keyword;
    }
}

export class TsInterfaceDeclaration extends TsExportableDeclaration {
    public getItemKind(): CompletionItemKind {
        return CompletionItemKind.Interface;
    }
}

export class TsVariableDeclaration extends TsExportableDeclaration {
    constructor(isExported: boolean, name: string, public isConst: boolean) {
        super(name, isExported);
    }
    public getItemKind(): CompletionItemKind {
        return CompletionItemKind.Variable;
    }
}

export class TsParameterDeclaration extends TsDeclaration {
    public getItemKind(): CompletionItemKind {
        return null;
    }
}

export class TsDefaultDeclaration extends TsDeclaration {
    public getItemKind(): CompletionItemKind {
        return CompletionItemKind.File;
    }
}

export class TsModuleDeclaration extends TsExportableDeclaration implements TsResolveInformation {
    public imports: TsImport[] = [];
    public declarations: TsDeclaration[] = [];
    public exports: TsExport[] = [];
    public usages: string[] = [];

    public get nonLocalUsages(): string[] {
        return this.usages.filter(usage => !this.declarations.some(o => o.name === usage));
    }

    public get moduleNamespaceName(): string {
        return this.name.split(/[-_]/).reduce((all, cur, idx) => {
            if (idx === 0) {
                return all + cur.toLowerCase();
            } else {
                return all + cur.charAt(0).toUpperCase() + cur.substring(1).toLowerCase();
            }
        }, '');
    }

    constructor(name: string, isExported: boolean, public isNamespace: boolean) {
        super(name, isExported);
    }

    public getItemKind(): CompletionItemKind {
        return CompletionItemKind.Module;
    }
}
