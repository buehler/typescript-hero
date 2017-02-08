import { Declaration } from '../declarations';
import { Export } from '../exports';
import { Import } from '../imports';
import { Node } from '../Node';
import { Resource } from './Resource';
import { parse, ParsedPath, relative } from 'path';
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

    /**
     * Returns the parsed path of a resource.
     * 
     * @readonly
     * @type {ParsedPath}
     * @memberOf TsFile
     */
    public get parsedPath(): ParsedPath {
        return parse(this.filePath);
    }

    /**
     * Determines if a file is a workspace file or an external resource.
     * 
     * @readonly
     * @type {boolean}
     * @memberOf TsFile
     */
    public get isWorkspaceFile(): boolean {
        return ['node_modules', 'typings'].every(o => this.filePath.indexOf(o) === -1);
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
