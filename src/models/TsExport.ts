import {TsExportableDeclaration} from './TsDeclaration';
import {TsResolveSpecifier} from './TsResolveSpecifier';
import {TsModule, TsNamespace, TsResource} from './TsResource';

export abstract class TsExport {
    constructor(public start: number, public end: number) { }
}

export abstract class TsFromExport {
    constructor(public start: number, public end: number, public from?: string) { }
}

export class TsAllFromExport extends TsFromExport {
}

export class TsNamedFromExport extends TsFromExport {
    public specifiers: TsResolveSpecifier[];
}

export class TsAssignedExport extends TsExport {
    public get exported(): (TsExportableDeclaration | TsResource)[] {
        return <(TsExportableDeclaration | TsResource)[]>[
            ...this._resource.declarations.filter(o => o instanceof TsExportableDeclaration && o.isExported && o.name === this.declarationIdentifier),
            ...this._resource.resources.filter(o => (o instanceof TsNamespace || o instanceof TsModule) && o.name === this.declarationIdentifier)
        ];
    }

    constructor(start: number, end: number, public declarationIdentifier: string, private _resource: TsResource) {
        super(start, end);
    }
}
