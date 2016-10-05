import {TsNode} from './TsNode';
import {TsResource} from './TsResource';
import {CompletionItemKind} from 'vscode';

export abstract class TsDeclaration extends TsNode {
    constructor(public name: string, start: number, end: number) {
        super(start, end);
    }

    public abstract getItemKind(): CompletionItemKind;
}

export abstract class TsExportableDeclaration extends TsDeclaration {
    constructor(name: string, start: number, end: number, public isExported: boolean) {
        super(name, start, end);
    }
}

export abstract class TsExportableCallableDeclaration extends TsExportableDeclaration {
    public parameters: ParameterDeclaration[] = [];
    public variables: VariableDeclaration[] = [];
}

export class InterfaceDeclaration extends TsExportableDeclaration {
    public properties: PropertyDeclaration[] = [];
    public methods: MethodDeclaration[] = [];

    public getItemKind(): CompletionItemKind {
        return CompletionItemKind.Interface;
    }
}

export class ClassDeclaration extends InterfaceDeclaration {
    public ctor: ConstructorDeclaration;

    public getItemKind(): CompletionItemKind {
        return CompletionItemKind.Class;
    }
}

export const enum PropertyVisibility {
    Private,
    Public,
    Protected
}

export class PropertyDeclaration extends TsDeclaration {
    constructor(name: string, start: number, end: number, public visibility: PropertyVisibility) {
        super(name, start, end);
    }

    public getItemKind(): CompletionItemKind {
        return CompletionItemKind.Property;
    }
}

export class MethodDeclaration extends TsExportableCallableDeclaration {
    constructor(name: string, start: number, end: number) {
        super(name, start, end, false);
    }

    public getItemKind(): CompletionItemKind {
        return CompletionItemKind.Method;
    }
}

export class FunctionDeclaration extends TsExportableCallableDeclaration {
    public getItemKind(): CompletionItemKind {
        return CompletionItemKind.Function;
    }
}

export class ConstructorDeclaration extends TsExportableCallableDeclaration {
    constructor(start: number, end: number) {
        super('constructor', start, end, false);
    }

    public getItemKind(): CompletionItemKind {
        return CompletionItemKind.Constructor;
    }
}

export class TypeAliasDeclaration extends TsExportableDeclaration {
    public getItemKind(): CompletionItemKind {
        return CompletionItemKind.Keyword;
    }
}

export class EnumDeclaration extends TsExportableDeclaration {
    public members: string[] = [];

    public getItemKind(): CompletionItemKind {
        return CompletionItemKind.Value;
    }
}

export class VariableDeclaration extends TsExportableDeclaration {
    constructor(name: string, start: number, end: number, isExported: boolean, public isConst: boolean) {
        super(name, start, end, isExported);
    }

    public getItemKind(): CompletionItemKind {
        return CompletionItemKind.Variable;
    }
}

export class ParameterDeclaration extends TsDeclaration {
    public getItemKind(): CompletionItemKind {
        return CompletionItemKind.Variable;
    }
}

export class DefaultDeclaration extends TsExportableDeclaration {
    private exported: TsDeclaration;

    public get exportedDeclaration(): TsDeclaration {
        if (!this.exported) {
            this.exported = this.resource.declarations.find(o => o.name === this.name);
        }

        return this.exported;
    }

    constructor(name: string, private resource: TsResource) {
        super(name, 0, 0, true);
    }

    public getItemKind(): CompletionItemKind {
        return CompletionItemKind.File;
    }
}

export class ModuleDeclaration extends TsDeclaration {
    public getItemKind(): CompletionItemKind {
        return CompletionItemKind.Module;
    }
}
