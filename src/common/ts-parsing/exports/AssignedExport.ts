import { isExportableDeclaration } from '../../type-guards';
import { ExportableDeclaration } from '../declarations';
import { nodeRange } from '../Node';
import { Module, Namespace, Resource } from '../resources';
import { Export } from './Export';
import { Range, TextDocument } from 'vscode-languageserver-types';

/**
 * Declares an all export (i.e. export * from ...).
 * 
 * @export
 * @class AssignedExport
 * @implements {Export}
 */
export class AssignedExport implements Export {
    public readonly _type: string = 'AssignedExport';

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
                    (o instanceof Namespace || o instanceof Module) && o.name === this.declarationIdentifier)
        ];
    }

    constructor(
        public start: number,
        public end: number,
        public declarationIdentifier: string,
        private resource: Resource
    ) { }

    /**
     * Calculates the document range of the node in the given document.
     * 
     * @param {TextDocument} document
     * @returns {Range}
     * 
     * @memberOf StringImport
     */
    public getRange(document: TextDocument): Range {
        return nodeRange(document, this.start, this.end);
    }
}
