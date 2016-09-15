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
    constructor(name: string, public visibility: PropertyVisibility) {
        super(name);
    }

    public getItemKind(): CompletionItemKind {
        return CompletionItemKind.Property;
    }
}

export class MethodDeclaration extends TsExportableCallableDeclaration {
    constructor(name: string) {
        super(name, false);
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
    constructor() {
        super('constructor', false);
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
    constructor(name: string, isExported: boolean, public isConst: boolean) {
        super(name, isExported);
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

export class DefaultDeclaration extends TsDeclaration {
    public getItemKind(): CompletionItemKind {
        return CompletionItemKind.File;
    }
}

export class ModuleDeclaration extends TsDeclaration {
    public getItemKind(): CompletionItemKind {
        return CompletionItemKind.Module;
    }
}
