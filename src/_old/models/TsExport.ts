import { TsExportableDeclaration } from './TsDeclaration';
import { TsNode } from './TsNode';
import { TsResolveSpecifier } from './TsResolveSpecifier';
import { TsModule, TsNamespace, TsResource } from './TsResource';

/**
 * Base export class.
 * 
 * @export
 * @abstract
 * @class TsExport
 * @extends {TsNode}
 */
export abstract class TsExport extends TsNode {
    constructor(start: number, end: number) {
        super(start, end);
    }
}

/**
 * Declares an export from (i.e. export ... from ...).
 * 
 * @export
 * @abstract
 * @class TsFromExport
 * @extends {TsNode}
 */
export abstract class TsFromExport extends TsNode {
    constructor(start: number, end: number, public from?: string) {
        super(start, end);
    }
}

/**
 * Declares an all export (i.e. export * from ...).
 * 
 * @export
 * @class TsAllFromExport
 * @extends {TsFromExport}
 */
export class TsAllFromExport extends TsFromExport {
}

/**
 * Declares a named export (i.e. export { Foobar } from ...).
 * 
 * @export
 * @class TsNamedFromExport
 * @extends {TsFromExport}
 */
export class TsNamedFromExport extends TsFromExport {
    public specifiers: TsResolveSpecifier[];
}

/**
 * Declares an assigned export which is used by external declarations (i.e. export = namespace).
 * 
 * @export
 * @class TsAssignedExport
 * @extends {TsExport}
 */
export class TsAssignedExport extends TsExport {
    public get exported(): (TsExportableDeclaration | TsResource)[] {
        return <(TsExportableDeclaration | TsResource)[]>[
            ...this._resource.declarations
                .filter(o =>
                    o instanceof TsExportableDeclaration && o.isExported && o.name === this.declarationIdentifier),
            ...this._resource.resources
                .filter(o =>
                    (o instanceof TsNamespace || o instanceof TsModule) && o.name === this.declarationIdentifier)
        ];
    }

    constructor(start: number, end: number, public declarationIdentifier: string, private _resource: TsResource) {
        super(start, end);
    }
}
