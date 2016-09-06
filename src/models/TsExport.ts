import {TsDeclaration} from './TsDeclaration';
import {TsResolveSpecifier} from './TsResolveSpecifier';
import {TsModule, TsNamespace, TsResource} from './TsResource';

export abstract class TsExport {
}

export abstract class TsFromExport {
    constructor(public from?: string) { }
}

export class TsAllFromExport extends TsFromExport {
}

export class TsNamedFromExport extends TsFromExport {
    public specifiers: TsResolveSpecifier[];
}

export class TsAssignedExport extends TsExport {
    public get exported(): (TsDeclaration|TsResource)[] {
        return [
            ...this._resource.declarations.filter(o => o.name === this.declarationIdentifier),
            ...this._resource.resources.filter(o => (o instanceof TsNamespace || o instanceof TsModule) && o.name === this.declarationIdentifier)
        ];
    }

    constructor(public declarationIdentifier: string, private _resource: TsResource) {
        super();
    }
}

//TODO delete this.
export class TsDefaultExport extends TsExport {
}
