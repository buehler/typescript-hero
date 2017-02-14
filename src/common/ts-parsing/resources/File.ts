import { Declaration } from '../declarations';
import { Export } from '../exports';
import { Import } from '../imports';
import { Node } from '../Node';
import { Module } from './Module';
import { Namespace } from './Namespace';
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
    public imports: Import[] = [];
    public exports: Export[] = [];
    public declarations: Declaration[] = [];
    public resources: Resource[] = [];
    public usages: string[] = [];

    public get identifier(): string {
        return '/' + relative(this.rootPath, this.filePath).replace(/([.]d)?[.]tsx?/g, '');
    }

    public get nonLocalUsages(): string[] {
        return this.usages.filter(
            usage => !this.declarations.some(o => o.name === usage) &&
                !this.resources.some(o => (o instanceof Module || o instanceof Namespace) && o.name === usage)
        );
    }

    /**
     * Returns the parsed path of a resource.
     * 
     * @readonly
     * @type {ParsedPath}
     * @memberOf File
     */
    public get parsedPath(): ParsedPath {
        return parse(this.filePath);
    }

    /**
     * Determines if a file is a workspace file or an external resource.
     * 
     * @readonly
     * @type {boolean}
     * @memberOf File
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
