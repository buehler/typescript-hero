import { Import } from './Import';
import { Node } from './Node';
import { Resource } from './Resource';
import { relative } from 'path';
import { Range, TextDocument } from 'vscode-languageserver-types';

export class File implements Resource, Node {
    public readonly _type: string = 'File';
    public imports: Import[] = [];

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
