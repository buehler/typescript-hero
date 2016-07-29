export abstract class TsDeclaration {
    constructor(public name: string) { }
}

export abstract class TsExportableDeclaration extends TsDeclaration {
    constructor(name: string, public isExported: boolean) {
        super(name);
    }
}

export class TsClassDeclaration extends TsExportableDeclaration {
}

export class TsFunctionDeclaration extends TsExportableDeclaration {
}

export class TsEnumDeclaration extends TsExportableDeclaration {
}

export class TsTypeDeclaration extends TsExportableDeclaration {
}

export class TsInterfaceDeclaration extends TsExportableDeclaration {
}

export class TsVariableDeclaration extends TsDeclaration {
    constructor(isExported: boolean, name: string, public isConst: boolean) {
        super(name);
    }
}

export class TsParameterDeclaration extends TsExportableDeclaration { }
