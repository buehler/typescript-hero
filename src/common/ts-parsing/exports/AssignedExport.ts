import { isExportableDeclaration } from '../../type-guards';
import { ExportableDeclaration } from '../declarations';
import { Module, Namespace, Resource } from '../resources';
import { Export } from './Export';
import { Serializable } from 'ts-json-serializer';

/**
 * Declares an all export (i.e. export * from ...).
 * 
 * @export
 * @class AssignedExport
 * @implements {Export}
 */
@Serializable({ factory: json => new AssignedExport(json.start, json.end, json.declarationIdentifier, json.resource) })
export class AssignedExport implements Export {
    /**
     * Returns a list of exported objects of this export.
     * This returns a list of possible exportable declarations or further exported resources.
     * 
     * @readonly
     * @type {((ExportableDeclaration | Resource)[])}
     * @memberOf AssignedExport
     */
    public get exported(): (ExportableDeclaration | Resource)[] {
        return <(ExportableDeclaration | Resource)[]>[
            ...this.resource.declarations
                .filter(o =>
                    isExportableDeclaration(o) && o.isExported && o.name === this.declarationIdentifier),
            ...this.resource.resources
                .filter(o =>
                    (o instanceof Namespace || o instanceof Module) && o.name === this.declarationIdentifier),
        ];
    }

    constructor(
        public start: number,
        public end: number,
        public declarationIdentifier: string,
        private resource: Resource,
    ) { }
}
