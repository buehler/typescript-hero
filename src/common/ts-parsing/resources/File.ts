import { Declaration } from '../declarations';
import { Export } from '../exports';
import { Import } from '../imports';
import { Node } from '../Node';
import { Module } from './Module';
import { Namespace } from './Namespace';
import { Resource } from './Resource';
import { parse, ParsedPath, relative } from 'path';
import { Serializable } from 'ts-json-serializer';

/**
 * Factory for deserializer. Creates a {@link File}.
 * 
 * @param {*} json
 * @returns {File}
 */
function typeFactory(json: any): File {
    const obj = new File(json.filePath, json.rootPath, json.start, json.end);
    obj.imports = json.imports;
    obj.exports = json.exports;
    obj.declarations = json.declarations;
    obj.resources = json.resources;
    obj.usages = json.usages;
    return obj;
}

/**
 * TypeScript resource. Basically a file that is located somewhere.
 * 
 * @export
 * @class File
 * @implements {Resource}
 * @implements {Node}
 */
@Serializable({ factory: typeFactory })
export class File implements Resource, Node {
    public imports: Import[] = [];
    public exports: Export[] = [];
    public declarations: Declaration[] = [];
    public resources: Resource[] = [];
    public usages: string[] = [];

    private rootPath: string;

    public get identifier(): string {
        return '/' + relative(this.rootPath, this.filePath).replace(/([.]d)?[.]tsx?/g, '');
    }

    public get nonLocalUsages(): string[] {
        return this.usages.filter(
            usage => !this.declarations.some(o => o.name === usage) &&
                !this.resources.some(o => (o instanceof Module || o instanceof Namespace) && o.name === usage),
        );
    }

    /**
     * Returns the parsed path of a resource.
     * 
     * @readonly
     * @type {ParsedPath}
     * @memberof File
     */
    public get parsedPath(): ParsedPath {
        return parse(this.filePath);
    }

    /**
     * Determines if a file is a workspace file or an external resource.
     * 
     * @readonly
     * @type {boolean}
     * @memberof File
     */
    public get isWorkspaceFile(): boolean {
        return ['node_modules', 'typings'].every(o => this.filePath.indexOf(o) === -1);
    }

    constructor(public filePath: string, rootPath: string, public start: number, public end: number) {
        this.rootPath = rootPath.replace('file://', '');
    }
}
