import { Declaration } from '../declarations';
import { Export } from '../exports';
import { Import } from '../imports';
import { Node } from '../Node';
import { Resource } from './Resource';
import { relative } from 'path';
import { Range, TextDocument } from 'vscode-languageserver-types';

/**
 * TypeScript resource. Basically a file that is located somewhere.
 * 
 * @export
 * @class File
 * @implements {Resource}
 * @implements {Node}
 */
export class File implements Resource, Node {
    public readonly _type: string = 'File';

    public imports: Import[] = [];
    public exports: Export[] = [];
    public declarations: Declaration[] = [];
    public resources: Resource[] = [];
    public usages: string[] = [];

    public get identifier(): string {
        return '/' + relative(this.rootPath, this.filePath).replace(/([.]d)?[.]tsx?/g, '');
    }

    constructor(public filePath: string, private rootPath: string, public start: number, public end: number) { }

    /**
     * Calculates the document range of the node in the given document.
     * 
     * @param {TextDocument} document
     * @returns {Range}
     * 
     * @memberOf StringImport
     */
    public getRange(document: TextDocument): Range {
        return Range.create(document.positionAt(this.start), document.positionAt(this.end));
    }
}
