export abstract class TsDeclaration {
    constructor(public isExported: boolean, public name: string) { }
}

export class TsClassDeclaration extends TsDeclaration {
}

export class TsFunctionDeclaration extends TsDeclaration {
}

export class TsEnumDeclaration extends TsDeclaration {
}

export class TsTypeDeclaration extends TsDeclaration {
}

export class TsInterfaceDeclaration extends TsDeclaration {
}

export class TsVariableDeclaration extends TsDeclaration {
    constructor(isExported: boolean, name: string, public isConst: boolean) {
        super(isExported, name);
    }
}

export class TsParameterDeclaration extends TsDeclaration { }
