import { DeclarationInfoIndex } from '../../common/indices';
import { TypescriptParser } from '../../common/ts-parsing';
import { DeclarationInfo, ModuleDeclaration } from '../../common/ts-parsing/declarations';
import { AllExport, NamedExport } from '../../common/ts-parsing/exports';
import { AssignedExport } from '../../common/ts-parsing/exports/AssignedExport';
import { File, Module, Namespace, Resource } from '../../common/ts-parsing/resources';
import { isExportableDeclaration } from '../../common/type-guards';
import { Logger, LoggerFactory } from '../../common/utilities';
import { iocSymbols } from '../IoCSymbols';
import { inject, injectable } from 'inversify';
import { join, normalize, relative, resolve } from 'path';

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
 * Helper type to index all possible resources of the current workspace.
 */
type Resources = { [name: string]: Resource };

/**
 * Global index of typescript declarations. Contains declarations and origins.
 * Provides reverse index for search and declaration info for imports.
 * 
 * @export
 * @class DeclarationIndex
 */
@injectable()
export class DeclarationIndex {
    private logger: Logger;
    private building: boolean;

    /**
     * Hash of parsed resources. Contains all parsed files / namespaces / declarations
     * of the current workspace.
     *
     * @private
     * @type {Resources}
     * @memberOf DeclarationIndex
     */
    private parsedResources: Resources = Object.create(null);

    /**
     * Declaration index. Reverse index from a name to many declarations assotiated to the name.
     * 
     * @private
     * @type {(DeclarationInfoIndex | undefined)}
     * @memberOf DeclarationIndex
     */
    private _index: DeclarationInfoIndex | undefined;

    /**
     * Indicator if the first index was loaded and calculated or not.
     * 
     * @readonly
     * @type {boolean}
     * @memberOf DeclarationIndex
     */
    public get indexReady(): boolean {
        return this._index !== undefined;
    }

    /**
     * Reverse index of the declarations.
     * 
     * @readonly
     * @type {(DeclarationInfoIndex | undefined)}
     * @memberOf DeclarationIndex
     */
    public get index(): DeclarationInfoIndex | undefined {
        return this._index;
    }

    /**
     * List of all declaration information. Contains the typescript declaration and the
     * "from" information (from where the symbol is imported). 
     * 
     * @readonly
     * @type {DeclarationInfo[]}
     * @memberOf DeclarationIndex
     */
    public get declarationInfos(): DeclarationInfo[] {
        return Object
            .keys(this.index)
            .sort()
            .reduce((all, key) => all.concat(this.index![key]), <DeclarationInfo[]>[]);
    }

    constructor(
        @inject(iocSymbols.loggerFactory) loggerFactory: LoggerFactory,
        private parser: TypescriptParser
    ) {
        this.logger = loggerFactory('DeclarationIndex');
        this.logger.info('Instantiated.');
    }

    /**
     * Resets the whole index. Does delete everything. Period.
     * Is useful for unit testing or similar things.
     * 
     * @memberOf DeclarationIndex
     */
    public reset(): void {
        this.parsedResources = Object.create(null);
        this._index = undefined;
        this.logger.info('Reset called, deleted index.');
    }

    /**
     * Tells the index to build a new index.
     * Can be canceled with a cancellationToken.
     * 
     * @param {string[]} filePathes
     * @param {string} rootPath
     * @returns {Promise<void>}
     * 
     * @memberOf DeclarationIndex
     */
    public async buildIndex(filePathes: string[], rootPath: string): Promise<void> {
        this.logger.info('Starting index refresh.');

        if (this.building) {
            this.logger.warning('Indexing already running, abort.');
        }

        try {
            this.building = true;
            this.logger.info(`Received ${filePathes.length} filepathes.`);

            const parsed = await this.parser.parseFiles(filePathes, rootPath);

            this.parsedResources = await this.parseResources(rootPath, parsed);
            this._index = await this.createIndex(this.parsedResources);

            this.logger.info('Finished indexing.');
        } catch (e) {
            throw e;
        } finally {
            this.building = false;
        }
    }

    /**
     * Rebuild the cache for one specific file. This can happen if a file is changed (saved)
     * and contains a new symbol. All resources are searched for files that possibly export
     * stuff from the given file and are rebuilt as well.
     * 
     * @param {string} filePath
     * @param {string} rootPath
     * @returns {Promise<void>}
     * 
     * @memberOf DeclarationIndex
     */
    public async rebuildForFile(filePath: string, rootPath: string): Promise<void> {
        const rebuildResource = '/' + relative(rootPath, filePath).replace(/[.]tsx?/g, ''),
            rebuildFiles = [filePath, ...this.getExportedResources(rebuildResource, rootPath)];

        const resources = await this.parseResources(rootPath, await this.parser.parseFiles(rebuildFiles, rootPath));

        for (let key of Object.keys(resources)) {
            this.parsedResources[key] = resources[key];
        }
        this._index = await this.createIndex(this.parsedResources);
    }

    /**
     * Removes the definitions and symbols for a specific file. This happens when
     * a file is deleted. All files that export symbols from this file are rebuilt as well.
     * 
     * @param {string} filePath
     * @param {string} rootPath
     * @returns {Promise<void>}
     * 
     * @memberOf DeclarationIndex
     */
    public async removeForFile(filePath: string, rootPath: string): Promise<void> {
        const removeResource = '/' + relative(rootPath, filePath).replace(/[.]tsx?/g, ''),
            rebuildFiles = this.getExportedResources(removeResource, rootPath);

        const resources = await this.parseResources(rootPath, await this.parser.parseFiles(rebuildFiles, rootPath));

        delete this.parsedResources[removeResource];
        for (let key of Object.keys(resources)) {
            this.parsedResources[key] = resources[key];
        }
        this._index = await this.createIndex(this.parsedResources);
    }

    /**
     * Returns a list of files that export a certain resource (declaration).
     * 
     * @private
     * @param {string} resourceToCheck
     * @param {string} rootPath
     * @returns {string[]}
     * 
     * @memberOf DeclarationIndex
     */
    private getExportedResources(resourceToCheck: string, rootPath: string): string[] {
        const resources: string[] = [];
        Object
            .keys(this.parsedResources)
            .filter(o => o.startsWith('/'))
            .forEach(key => {
                const resource = this.parsedResources[key] as File;
                if (this.doesExportResource(resource, resourceToCheck, rootPath)) {
                    resources.push(resource.filePath);
                }
            });
        return resources;
    }

    /**
     * Checks if a file does export another resource.
     * (i.e. export ... from ...)
     * 
     * @private
     * @param {File} resource The file that is checked
     * @param {string} resourcePath The resource that is searched for
     * @param {string} rootPath The rootpath of the workspace
     * @returns {boolean}
     * 
     * @memberOf DeclarationIndex
     */
    private doesExportResource(resource: File, resourcePath: string, rootPath: string): boolean {
        let exportsResource = false;

        for (let ex of resource.exports) {
            if (exportsResource) {
                break;
            }
            if (ex instanceof AllExport || ex instanceof NamedExport) {
                const exported = '/' + relative(rootPath, normalize(join(resource.parsedPath.dir, ex.from)));
                exportsResource = exported === resourcePath;
            }
        }

        return exportsResource;
    }

    /**
     * Does parse the resources (symbols and declarations) of a given file.
     * Can be cancelled with the token.
     *
     * @private
     * @param {string} rootPath
     * @param {File[]} [files=[]]
     * @returns {Promise<Resources>}
     * 
     * @memberOf DeclarationIndex
     */
    private async parseResources(rootPath: string, files: File[] = []): Promise<Resources> {
        const parsedResources: Resources = Object.create(null);

        for (let file of files) {
            if (file.filePath.indexOf('typings') > -1 || file.filePath.indexOf('node_modules/@types') > -1) {
                for (let resource of file.resources) {
                    parsedResources[resource.identifier] = resource;
                }
            } else if (file.filePath.indexOf('node_modules') > -1) {
                const libname = getNodeLibraryName(file.filePath);
                parsedResources[libname] = file;
            } else {
                parsedResources[file.identifier] = file;
            }
        }

        for (let key of Object.keys(parsedResources).sort((k1, k2) => k2.length - k1.length)) {
            const resource = parsedResources[key];
            resource.declarations = resource.declarations.filter(
                o => isExportableDeclaration(o) && o.isExported
            );
            this.processResourceExports(rootPath, parsedResources, resource);
        }

        return parsedResources;
    }

    /**
     * Creates a reverse index out of the give resources.
     * Can be cancelled with the token.
     * 
     * @private
     * @param {Resources} resources
     * @returns {Promise<ResourceIndex>}
     * 
     * @memberOf DeclarationIndex
     */
    private async createIndex(resources: Resources): Promise<DeclarationInfoIndex> {
        // Use an empty object without a prototype, so that "toString" (for example) can be indexed
        // Thanks to @gund in https://github.com/buehler/typescript-hero/issues/79
        const index: DeclarationInfoIndex = Object.create(null);

        for (let key of Object.keys(resources)) {
            const resource = resources[key];
            if (resource instanceof Namespace || resource instanceof Module) {
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
                const from = key.replace(/[/]?index$/, '') || '/';
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
     * @param {string} rootPath
     * @param {Resources} parsedResources
     * @param {Resource} resource
     * @param {Resource[]} [processedResources=[]]
     * @returns {void}
     * 
     * @memberOf DeclarationIndex
     */
    private processResourceExports(
        rootPath: string,
        parsedResources: Resources,
        resource: Resource,
        processedResources: Resource[] = []
    ): void {
        if (processedResources.indexOf(resource) >= 0) {
            return;
        }
        processedResources.push(resource);

        for (let ex of resource.exports) {
            if (resource instanceof File && (ex instanceof NamedExport || ex instanceof AllExport)) {
                if (!ex.from) {
                    return;
                }

                let sourceLib = resolve(resource.parsedPath.dir, ex.from);
                if (sourceLib.indexOf('node_modules') > -1) {
                    sourceLib = getNodeLibraryName(sourceLib);
                } else {
                    sourceLib = '/' + relative(rootPath, sourceLib).replace(/([.]d)?[.]tsx?/g, '');
                }

                if (!parsedResources[sourceLib]) {
                    return;
                }

                let exportedLib = parsedResources[sourceLib];
                this.processResourceExports(rootPath, parsedResources, exportedLib, processedResources);

                if (ex instanceof AllExport) {
                    this.processAllFromExport(resource, exportedLib);
                } else {
                    this.processNamedFromExport(ex, resource, exportedLib);
                }
            } else {
                if (ex instanceof AssignedExport) {
                    for (let lib of ex.exported.filter(o => !isExportableDeclaration(o))) {
                        this.processResourceExports(rootPath, parsedResources, lib as Resource, processedResources);
                    }
                    this.processAssignedExport(ex, resource);
                } else if (ex instanceof NamedExport && ex.from && parsedResources[ex.from]) {
                    this.processResourceExports(
                        rootPath, parsedResources, parsedResources[ex.from], processedResources
                    );
                    this.processNamedFromExport(ex, resource, parsedResources[ex.from]);
                }
            }
        }
    }

    /**
     * Processes an all export, does move the declarations accordingly.
     * (i.e. export * from './myFile')
     * 
     * @private
     * @param {Resource} exportingLib
     * @param {Resource} exportedLib
     * 
     * @memberOf DeclarationIndex
     */
    private processAllFromExport(exportingLib: Resource, exportedLib: Resource): void {
        exportingLib.declarations.push(...exportedLib.declarations);
        exportedLib.declarations = [];
    }

    /**
     * Processes a named export, does move the declarations accordingly.
     * (i.e. export {MyClass} from './myFile')
     * 
     * @private
     * @param {NamedExport} tsExport
     * @param {Resource} exportingLib
     * @param {Resource} exportedLib
     * 
     * @memberOf DeclarationIndex
     */
    private processNamedFromExport(
        tsExport: NamedExport,
        exportingLib: Resource,
        exportedLib: Resource
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
     * @param {AssignedExport} tsExport
     * @param {Resource} exportingLib
     * 
     * @memberOf DeclarationIndex
     */
    private processAssignedExport(
        tsExport: AssignedExport,
        exportingLib: Resource
    ): void {
        tsExport.exported.forEach(exported => {
            if (isExportableDeclaration(exported)) {
                exportingLib.declarations.push(exported);
            } else {
                exportingLib.declarations.push(
                    ...exported.declarations.filter(
                        o => isExportableDeclaration(o) && o.isExported
                    )
                );
                exported.declarations = [];
            }
        });
    }
}
