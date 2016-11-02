import { TsDeclaration } from './TsDeclaration';
import { TsExport } from './TsExport';
import { TsImport } from './TsImport';
import { TsNode } from './TsNode';
import { parse, ParsedPath } from 'path';
import { workspace } from 'vscode';

/**
 * Base class for resources. All resources share the same properties.
 * 
 * @export
 * @abstract
 * @class TsResource
 * @extends {TsNode}
 */
export abstract class TsResource extends TsNode {
    public imports: TsImport[] = [];
    public declarations: TsDeclaration[] = [];
    public exports: TsExport[] = [];
    public resources: TsResource[] = [];
    public usages: string[] = [];

    constructor(start: number, end: number) {
        super(start, end);
    }

    /**
     * Returns an array of usages (a usage is a used symbol name in the resource)
     * that are not covered by its own declarations. 
     * 
     * @readonly
     * @type {string[]}
     * @memberOf TsResource
     */
    public get nonLocalUsages(): string[] {
        return this.usages.filter(
            usage => !this.declarations.some(o => o.name === usage) &&
                !this.resources.some(o => o instanceof TsNamedResource && o.name === usage)
        );
    }

    /**
     * Returns the (atleast I hope) unique identifier of a resource.
     * This can be a filepath relative to the workspace or a libraryname.
     * 
     * @abstract
     * @returns {string}
     * 
     * @memberOf TsResource
     */
    public abstract getIdentifier(): string;
}

/**
 * Basic resource for all files in the workspace that are human made or downloaded (*.d.ts) files.
 * 
 * @export
 * @class TsFile
 * @extends {TsResource}
 */
export class TsFile extends TsResource {
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

    constructor(public filePath: string, start: number, end: number) {
        super(start, end);
    }

    /**
     * Returns the relative path of the file in a workspace. Uses a trailing slash to identify the file.
     * 
     * @returns {string}
     * 
     * @memberOf TsFile
     */
    public getIdentifier(): string {
        return '/' + workspace.asRelativePath(this.filePath).replace(/([.]d)?[.]tsx?/g, '');
    }
}

/**
 * A named resource is a module or namespace that is declared by a *.d.ts file.
 * Contains the declarations and information about that instance.
 * 
 * @export
 * @abstract
 * @class TsNamedResource
 * @extends {TsResource}
 */
export abstract class TsNamedResource extends TsResource {
    constructor(public name: string, start: number, end: number) {
        super(start, end);
    }

    /**
     * Function that calculates the alias name of a namespace.
     * Removes all underlines and dashes and camelcases the name.
     * 
     * @returns {string}
     * 
     * @memberOf TsNamedResource
     */
    public getNamespaceAlias(): string {
        return this.name.split(/[-_]/).reduce((all, cur, idx) => {
            if (idx === 0) {
                return all + cur.toLowerCase();
            } else {
                return all + cur.charAt(0).toUpperCase() + cur.substring(1).toLowerCase();
            }
        }, '');
    }

    /**
     * Returns the full library name of the module or namespace.
     * 
     * @returns {string}
     * 
     * @memberOf TsNamedResource
     */
    public getIdentifier(): string {
        return this.name;
    }
}

/**
 * Declaration of a typescript module (i.e. declare module "foobar").
 * 
 * @export
 * @class TsModule
 * @extends {TsNamedResource}
 */
export class TsModule extends TsNamedResource { }

/**
 * Declaration of a typescript namespace (i.e. declare foobar).
 * 
 * @export
 * @class TsNamespace
 * @extends {TsNamedResource}
 */
export class TsNamespace extends TsNamedResource { }
