export abstract class TsDeclaration {
    constructor(public name: string) { }

    //public abstract getItemKind(): CompletionItemKind;
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
}

export class ClassDeclaration extends InterfaceDeclaration {
    public ctor: ConstructorDeclaration;
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
}

export class MethodDeclaration extends TsExportableCallableDeclaration { }

export class FunctionDeclaration extends TsExportableCallableDeclaration { }

export class ConstructorDeclaration extends TsExportableCallableDeclaration { }

export class TypeAliasDeclaration extends TsExportableDeclaration { }

export class EnumDeclaration extends TsExportableDeclaration {
    public members: string[] = [];
}

export class VariableDeclaration extends TsExportableDeclaration {
    constructor(name: string, isExported: boolean, public isConst: boolean) {
        super(name, isExported);
    }
}

export class ParameterDeclaration extends TsDeclaration { }

export class DefaultDeclaration extends TsDeclaration { }
