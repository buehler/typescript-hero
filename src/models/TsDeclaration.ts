export abstract class TsDeclaration {
    constructor(public isExported: boolean) { }
}

export abstract class TsNamedDeclaration extends TsDeclaration {
    constructor(isExported: boolean, public name: string) {
        super(isExported);
    }
}

export class TsClassDeclaration extends TsNamedDeclaration {
}

export class TsFunctionDeclaration extends TsNamedDeclaration {
}

export class TsEnumDeclaration extends TsNamedDeclaration {
}

export class TsTypeDeclaration extends TsNamedDeclaration {
}

export class TsInterfaceDeclaration extends TsNamedDeclaration {
}

export class TsVariableDeclaration extends TsNamedDeclaration {
    constructor(isExported: boolean, name: string, public isConst: boolean) {
        super(isExported, name);
    }
}
