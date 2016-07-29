import {TsResolveSpecifier} from './TsResolveSpecifier';

export abstract class TsExport {
}

export abstract class TsNamedExport extends TsExport {
    constructor(public name: string) {
        super();
    }
}

export abstract class TsFromExport extends TsExport {
    constructor(public from: string) {
        super();
    }
}

export class TsClassExport extends TsNamedExport {
}

export class TsFunctionExport extends TsNamedExport {
}

export class TsEnumExport extends TsNamedExport {
}

export class TsTypeExport extends TsNamedExport {
}

export class TsInterfaceExport extends TsNamedExport {
}

export class TsVariableExport extends TsNamedExport {
    constructor(name: string, public isConst: boolean) {
        super(name);
    }
}

export class TsAllFromExport extends TsFromExport {
}

export class TsNamedFromExport extends TsFromExport {
    public specifiers: TsResolveSpecifier[];
}
