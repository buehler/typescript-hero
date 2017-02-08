import { nodeRange } from '../Node';
import { Resource } from '../resources';
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

    public get exported(): (Resource)[] {
        // TsExportableDeclaration
        throw new Error(`TODO ${this.resource}`);
        // return <(TsExportableDeclaration | TsResource)[]>[
        //     ...this._resource.declarations
        //         .filter(o =>
        //             o instanceof TsExportableDeclaration && o.isExported && o.name === this.declarationIdentifier),
        //     ...this._resource.resources
        //         .filter(o =>
        //             (o instanceof TsNamespace || o instanceof TsModule) && o.name === this.declarationIdentifier)
        // ];
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
