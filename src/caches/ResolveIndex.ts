import { ExtensionConfig } from '../ExtensionConfig';
import {
    ModuleDeclaration,
    TsDeclaration,
    TsExportableDeclaration,
    TsTypedExportableDeclaration
} from '../models/TsDeclaration';
import { TsAllFromExport, TsAssignedExport, TsFromExport, TsNamedFromExport } from '../models/TsExport';
import { TsFile, TsNamedResource, TsResource } from '../models/TsResource';
import { TsResourceParser } from '../parser/TsResourceParser';
import { Logger, LoggerFactory } from '../utilities/Logger';
import { existsSync } from 'fs';
import { inject, injectable } from 'inversify';
import { join, normalize, resolve } from 'path';
import { CancellationToken, CancellationTokenSource, Uri, workspace } from 'vscode';

/**
 * Type that defines information about a declaration.
 * Contains the declaration and the origin of the declaration.
 */
export type DeclarationInfo = { declaration: TsDeclaration, from: string };

/**
 * Type for the reverse index of all declarations
 */
export type ResourceIndex = { [declaration: string]: DeclarationInfo[] };

type Resources = { [name: string]: TsResource };

/**
 * Returns the name of the node folder. Is used as the library name for indexing.
 * (e.g. ./node_modules/webpack returns webpack)
 * 
 * @param {string} path
 * @returns {string}
 */
function getNodeLibraryName(path: string): string {
    let dirs = path.split(/\/|\\/),
        nodeIndex = dirs.indexOf('node_modules');

    return dirs.slice(nodeIndex + 1).join('/')
        .replace(/([.]d)?([.]tsx?)?/g, '')
        .replace(new RegExp(`/(index|${dirs[nodeIndex + 1]})$`), '');
}

/**
 * Global index of typescript declarations. Contains declarations and origins.
 * Provides reverse index for search and declaration info for imports.
 * 
 * @export
 * @class ResolveIndex
 */
@injectable()
export class ResolveIndex {
    private logger: Logger;
    private cancelToken: CancellationTokenSource;

    private parsedResources: Resources = Object.create(null);
    private _index: ResourceIndex;

    /**
     * Indicator if the first index was loaded and calculated or not.
     * 
     * @readonly
     * @type {boolean}
     * @memberOf ResolveIndex
     */
    public get indexReady(): boolean {
        return !!this._index;
    }

    /**
     * Reverse index of the declarations.
     * 
     * @readonly
     * @type {ResourceIndex}
     * @memberOf ResolveIndex
     */
    public get index(): ResourceIndex {
        return this._index;
    }

    /**
     * List of all declaration information. Contains the typescript declaration and the
     * "from" information (from where the symbol is imported). 
     * 
     * @readonly
     * @type {DeclarationInfo[]}
     * @memberOf ResolveIndex
     */
    public get declarationInfos(): DeclarationInfo[] {
        return Object
            .keys(this.index)
            .sort()
            .reduce((all, key) => all.concat(this.index[key]), []);
    }

    constructor(
        @inject('LoggerFactory') loggerFactory: LoggerFactory,
        private parser: TsResourceParser,
        private config: ExtensionConfig
    ) {
        this.logger = loggerFactory('ResolveIndex');
    }

    /**
     * Tells the index to build a new index.
     * Can be canceled with a cancellationToken.
     * 
     * @param {CancellationToken} [cancellationToken]
     * @returns {Promise<boolean>} true when the index was successful or sucessfully canceled
     * 
     * @memberOf ResolveIndex
     */
    public async buildIndex(cancellationToken?: CancellationToken): Promise<boolean> {
        if (this.cancelToken) {
            this.logger.info('Refresh already running, canceling first.');
            this.cancelRefresh();
        }

        this.logger.info('Starting index refresh.');
        this.cancelToken = new CancellationTokenSource();

        try {
            let files = await this.findFiles(cancellationToken);

            if (cancellationToken && cancellationToken.onCancellationRequested) {
                this.cancelRequested();
                return true;
            }

            this.logger.info(`Finding finished. Found ${files.length} files.`);

            let parsed = await this.parser.parseFiles(files);

            if (cancellationToken && cancellationToken.onCancellationRequested) {
                this.cancelRequested();
                return true;
            }

            this.parsedResources = await this.parseResources(parsed, cancellationToken);
            this._index = await this.createIndex(this.parsedResources, cancellationToken);
            return true;
        } catch (e) {
            this.logger.error('Catched an error during buildIndex()', e);
            return false;
        } finally {
            if (this.cancelToken) {
                this.cancelToken.dispose();
                this.cancelToken = null;
            }
        }
    }

    /**
     * Rebuild the cache for one specific file. This can happen if a file is changed (saved)
     * and contains a new symbol. All resources are searched for files that possibly export
     * stuff from the given file and are rebuilt as well.
     * 
     * @param {string} filePath
     * @returns {Promise<boolean>}
     * 
     * @memberOf ResolveIndex
     */
    public async rebuildForFile(filePath: string): Promise<boolean> {
        let rebuildResource = '/' + workspace.asRelativePath(filePath).replace(/[.]tsx?/g, ''),
            rebuildFiles = [<Uri>{ fsPath: filePath }, ...this.getExportedResources(rebuildResource)];

        try {
            let resources = await this.parseResources(await this.parser.parseFiles(rebuildFiles));

            for (let key of Object.keys(resources)) {
                this.parsedResources[key] = resources[key];
            }
            this._index = await this.createIndex(this.parsedResources);
            return true;
        } catch (e) {
            this.logger.error('Catched an error during rebuildForFile()', e);
            return false;
        }
    }

    /**
     * Removes the definitions and symbols for a specific file. This happens when
     * a file is deleted. All files that export symbols from this file are rebuilt as well.
     * 
     * @param {string} filePath
     * @returns {Promise<void>}
     * 
     * @memberOf ResolveIndex
     */
    public async removeForFile(filePath: string): Promise<boolean> {
        let removeResource = '/' + workspace.asRelativePath(filePath).replace(/[.]tsx?/g, ''),
            rebuildFiles = this.getExportedResources(removeResource);

        try {
            let resources = await this.parseResources(await this.parser.parseFiles(rebuildFiles));

            delete this.parsedResources[removeResource];
            for (let key of Object.keys(resources)) {
                this.parsedResources[key] = resources[key];
            }
            this._index = await this.createIndex(this.parsedResources);
            return true;
        } catch (e) {
            this.logger.error('Catched an error during removeForFile()', e);
            return false;
        }
    }

    /**
     * Possibility to cancel a scheduled index refresh. Does dispose the cancellationToken
     * to indicate a cancellation.
     * 
     * @memberOf ResolveIndex
     */
    public cancelRefresh(): void {
        if (this.cancelToken) {
            this.logger.info('Canceling refresh.');
            this.cancelToken.dispose();
            this.cancelToken = null;
        }
    }

    /**
     * Resets the whole index. Does delete everything. Period.
     * 
     * @memberOf ResolveIndex
     */
    public reset(): void {
        this.parsedResources = null;
        this._index = null;
    }

    /**
     * Searches through all workspace files to return those, that need to be indexed.
     * The following search patterns apply:
     * - All *.ts and *.tsx of the actual workspace
     * - All *.d.ts files that live in a linked node_module folder (if there is a package.json)
     * - All *.d.ts files that are located in a "typings" folder
     * 
     * @private
     * @param {CancellationToken} cancellationToken
     * @returns {Promise<Uri[]>}
     * 
     * @memberOf ResolveIndex
     */
    private async findFiles(cancellationToken: CancellationToken): Promise<Uri[]> {
        let searches: PromiseLike<Uri[]>[] = [
            workspace.findFiles(
                '{**/*.ts,**/*.tsx}',
                '{**/node_modules/**,**/typings/**}',
                undefined,
                cancellationToken
            )
        ];

        let globs = [],
            ignores = ['**/typings/**'];

        if (workspace.rootPath && existsSync(join(workspace.rootPath, 'package.json'))) {
            let packageJson = require(join(workspace.rootPath, 'package.json'));
            if (packageJson['dependencies']) {
                globs = globs.concat(
                    Object.keys(packageJson['dependencies']).map(o => `**/node_modules/${o}/**/*.d.ts`)
                );
                ignores = ignores.concat(
                    Object.keys(packageJson['dependencies']).map(o => `**/node_modules/${o}/node_modules/**`)
                );
            }
            if (packageJson['devDependencies']) {
                globs = globs.concat(
                    Object.keys(packageJson['devDependencies']).map(o => `**/node_modules/${o}/**/*.d.ts`)
                );
                ignores = ignores.concat(
                    Object.keys(packageJson['devDependencies']).map(o => `**/node_modules/${o}/node_modules/**`)
                );
            }
        } else {
            globs.push('**/node_modules/**/*.d.ts');
        }
        searches.push(
            workspace.findFiles(`{${globs.join(',')}}`, `{${ignores.join(',')}}`, undefined, cancellationToken)
        );

        searches.push(
            workspace.findFiles('**/typings/**/*.d.ts', '**/node_modules/**', undefined, cancellationToken)
        );

        let uris = await Promise.all(searches);
        if (cancellationToken && cancellationToken.onCancellationRequested) {
            this.cancelRequested();
            return;
        }
        let excludePatterns = this.config.resolver.ignorePatterns;
        uris = uris.map((o, idx) => idx === 0 ?
            o.filter(
                f => f.fsPath
                    .replace(workspace.rootPath, '')
                    .split(/\\|\//)
                    .every(p => excludePatterns.indexOf(p) < 0)) :
            o
        );
        this.logger.info(`Found ${uris.reduce((sum, cur) => sum + cur.length, 0)} files.`);
        return uris.reduce((all, cur) => all.concat(cur), []);
    }

    /**
     * Does parse the resources (symbols and declarations) of a given file.
     * Can be cancelled with the token.
     * 
     * @private
     * @param {TsFile[]} files
     * @param {CancellationToken} [cancellationToken]
     * @returns {Promise<Resources>}
     * 
     * @memberOf ResolveIndex
     */
    private async parseResources(files: TsFile[] = [], cancellationToken?: CancellationToken): Promise<Resources> {
        let parsedResources: Resources = {};

        for (let file of files) {
            if (file.filePath.indexOf('typings') > -1 || file.filePath.indexOf('node_modules/@types') > -1) {
                for (let resource of file.resources) {
                    parsedResources[resource.getIdentifier()] = resource;
                }
            } else if (file.filePath.indexOf('node_modules') > -1) {
                let libname = getNodeLibraryName(file.filePath);
                parsedResources[libname] = file;
            } else {
                parsedResources[file.getIdentifier()] = file;
            }
        }

        if (cancellationToken && cancellationToken.onCancellationRequested) {
            this.cancelRequested();
            return;
        }

        for (let key of Object.keys(parsedResources).sort((k1, k2) => k2.length - k1.length)) {
            if (cancellationToken && cancellationToken.onCancellationRequested) {
                this.cancelRequested();
                return;
            }
            let resource = parsedResources[key];
            resource.declarations = resource.declarations.filter(
                o => (o instanceof TsExportableDeclaration || o instanceof TsTypedExportableDeclaration) && o.isExported
            );
            this.processResourceExports(parsedResources, resource);
        }

        return parsedResources;
    }

    /**
     * Creates a reverse index out of the give resources.
     * Can be cancelled with the token.
     * 
     * @private
     * @param {Resources} resources
     * @param {CancellationToken} [cancellationToken]
     * @returns {Promise<ResourceIndex>}
     * 
     * @memberOf ResolveIndex
     */
    private async createIndex(resources: Resources, cancellationToken?: CancellationToken): Promise<ResourceIndex> {
        if (cancellationToken && cancellationToken.onCancellationRequested) {
            this.cancelRequested();
            return;
        }

        // Use an empty object without a prototype, so that "toString" (for example) can be indexed
        // Thanks to @gund in https://github.com/buehler/typescript-hero/issues/79
        let index: ResourceIndex = Object.create(null);

        for (let key of Object.keys(resources)) {
            let resource = resources[key];
            if (resource instanceof TsNamedResource) {
                if (!index[resource.name]) {
                    index[resource.name] = [];
                }
                index[resource.name].push({
                    declaration: new ModuleDeclaration(resource.getNamespaceAlias(), resource.start, resource.end),
                    from: resource.name
                });
            }
            for (let declaration of resource.declarations) {
                if (!index[declaration.name]) {
                    index[declaration.name] = [];
                }
                let from = key.replace(/[/]?index$/, '') || '/';
                if (!index[declaration.name].some(
                    o => o.declaration.constructor === declaration.constructor && o.from === from
                )) {
                    index[declaration.name].push({
                        declaration,
                        from
                    });
                }
            }
        }
        return index;
    }

    /**
     * Process all exports of a the parsed resources. Does move the declarations accordingly to their
     * export nature.
     * 
     * @private
     * @param {Resources} parsedResources
     * @param {TsResource} resource
     * @returns {void}
     * 
     * @memberOf ResolveIndex
     */
    private processResourceExports(
        parsedResources: Resources,
        resource: TsResource,
        processedResources: TsResource[] = []
    ): void {
        if (processedResources.indexOf(resource) >= 0) {
            return;
        }
        processedResources.push(resource);

        for (let ex of resource.exports) {
            if (resource instanceof TsFile && ex instanceof TsFromExport) {
                if (!ex.from) {
                    return;
                }

                let sourceLib = resolve(resource.parsedPath.dir, ex.from);
                if (sourceLib.indexOf('node_modules') > -1) {
                    sourceLib = getNodeLibraryName(sourceLib);
                } else {
                    sourceLib = '/' + workspace.asRelativePath(sourceLib).replace(/([.]d)?[.]tsx?/g, '');
                }

                if (!parsedResources[sourceLib]) {
                    return;
                }

                let exportedLib = parsedResources[sourceLib];
                this.processResourceExports(parsedResources, exportedLib, processedResources);

                if (ex instanceof TsAllFromExport) {
                    this.processAllFromExport(parsedResources, resource, exportedLib);
                } else if (ex instanceof TsNamedFromExport) {
                    this.processNamedFromExport(parsedResources, ex, resource, exportedLib);
                }
            } else {
                if (ex instanceof TsAssignedExport) {
                    for (let lib of ex.exported.filter(
                        o => !(o instanceof TsExportableDeclaration) && !(o instanceof TsTypedExportableDeclaration))
                    ) {
                        this.processResourceExports(parsedResources, lib as TsResource, processedResources);
                    }
                    this.processAssignedExport(parsedResources, ex, resource);
                } else if (ex instanceof TsNamedFromExport && ex.from && parsedResources[ex.from]) {
                    this.processResourceExports(parsedResources, parsedResources[ex.from], processedResources);
                    this.processNamedFromExport(parsedResources, ex, resource, parsedResources[ex.from]);
                }
            }
        }
    }

    /**
     * Processes an all export, does move the declarations accordingly.
     * (i.e. export * from './myFile')
     * 
     * @private
     * @param {Resources} parsedResources
     * @param {TsResource} exportingLib
     * @param {TsResource} exportedLib
     * 
     * @memberOf ResolveIndex
     */
    private processAllFromExport(parsedResources: Resources, exportingLib: TsResource, exportedLib: TsResource): void {
        exportingLib.declarations.push(...exportedLib.declarations);
        exportedLib.declarations = [];
    }

    /**
     * Processes a named export, does move the declarations accordingly.
     * (i.e. export {MyClass} from './myFile')
     * 
     * @private
     * @param {Resources} parsedResources
     * @param {TsNamedFromExport} tsExport
     * @param {TsResource} exportingLib
     * @param {TsResource} exportedLib
     * 
     * @memberOf ResolveIndex
     */
    private processNamedFromExport(
        parsedResources: Resources,
        tsExport: TsNamedFromExport,
        exportingLib: TsResource,
        exportedLib: TsResource
    ): void {
        exportedLib.declarations
            .forEach(o => {
                let ex = tsExport.specifiers.find(s => s.specifier === o.name);
                if (!ex) {
                    return;
                }
                exportedLib.declarations.splice(exportedLib.declarations.indexOf(o), 1);
                if (ex.alias) {
                    o.name = ex.alias;
                }
                exportingLib.declarations.push(o);
            });
    }

    /**
     * Processes an assigned export, does move the declarations accordingly.
     * (i.e. export = namespaceName)
     * 
     * @private
     * @param {Resources} parsedResources
     * @param {TsAssignedExport} tsExport
     * @param {TsResource} exportingLib
     * 
     * @memberOf ResolveIndex
     */
    private processAssignedExport(
        parsedResources: Resources,
        tsExport: TsAssignedExport,
        exportingLib: TsResource
    ): void {
        tsExport.exported.forEach(exported => {
            if (exported instanceof TsExportableDeclaration || exported instanceof TsTypedExportableDeclaration) {
                exportingLib.declarations.push(exported);
            } else {
                exportingLib.declarations.push(
                    ...exported.declarations.filter(
                        o => (o instanceof TsExportableDeclaration || o instanceof TsTypedExportableDeclaration) &&
                            o.isExported
                    )
                );
                exported.declarations = [];
            }
        });
    }

    /**
     * Returns a list of files that export a certain resource (declaration).
     * 
     * @private
     * @param {string} resourceToCheck
     * @returns {Uri[]}
     * 
     * @memberOf ResolveIndex
     */
    private getExportedResources(resourceToCheck: string): Uri[] {
        let resources = [];
        Object
            .keys(this.parsedResources)
            .filter(o => o.startsWith('/'))
            .forEach(key => {
                let resource = this.parsedResources[key] as TsFile;
                if (this.doesExportResource(resource, resourceToCheck)) {
                    resources.push(<Uri>{ fsPath: resource.filePath });
                }
            });
        return resources;
    }

    /**
     * Checks if a file does export another resource.
     * (i.e. export ... from ...)
     * 
     * @private
     * @param {TsFile} resource - The file that is checked
     * @param {string} resourcePath - The resource that is searched for
     * @returns {boolean}
     * 
     * @memberOf ResolveIndex
     */
    private doesExportResource(resource: TsFile, resourcePath: string): boolean {
        let exportsResource = false;

        for (let ex of resource.exports) {
            if (exportsResource) {
                break;
            }
            if (ex instanceof TsAllFromExport || ex instanceof TsNamedFromExport) {
                let exported = '/' + workspace.asRelativePath(normalize(join(resource.parsedPath.dir, ex.from)));
                exportsResource = exported === resourcePath;
            }
        }

        return exportsResource;
    }

    /**
     * Loggs the requested cancellation.
     * 
     * @private
     * 
     * @memberOf ResolveIndex
     */
    private cancelRequested(): void {
        this.logger.info('Cancellation requested.');
    }
}
