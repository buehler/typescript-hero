import {TsResolveSpecifier} from './TsResolveSpecifier';

export abstract class TsExport {
}

export abstract class TsNamedExport {
    public name: string;
}

export abstract class TsFromExport extends TsExport {
    public from: string;
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
    public isConst: boolean;
}

export class TsAllFromExport extends TsFromExport {
}

export class TsNamedFromExport extends TsFromExport {
    public specifiers: TsResolveSpecifier[];
}
