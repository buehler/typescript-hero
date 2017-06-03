import { normalizePathUri } from '../../common/helpers/PathHelpers';
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
import { FileChangeType, FileEvent } from 'vscode-languageserver';

/**
 * Returns the name of the node folder. Is used as the library name for indexing.
 * (e.g. ./node_modules/webpack returns webpack)
 * 
 * @param {string} path
 * @returns {string}
 */
function getNodeLibraryName(path: string): string {
    const dirs = path.split(/\/|\\/);
    const nodeIndex = dirs.indexOf('node_modules');

    return dirs.slice(nodeIndex + 1).join('/')
        .replace(/([.]d)?([.]tsx?)?/g, '')
        .replace(new RegExp(`/(index|${dirs[nodeIndex + 1]}|${dirs[dirs.length - 2]})$`), '');
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
     * @memberof DeclarationIndex
     */
    private parsedResources: Resources = Object.create(null);

    /**
     * Declaration index. Reverse index from a name to many declarations assotiated to the name.
     * 
     * @private
     * @type {(DeclarationInfoIndex | undefined)}
     * @memberof DeclarationIndex
     */
    private _index: DeclarationInfoIndex | undefined;

    /**
     * Indicator if the first index was loaded and calculated or not.
     * 
     * @readonly
     * @type {boolean}
     * @memberof DeclarationIndex
     */
    public get indexReady(): boolean {
        return this._index !== undefined;
    }

    /**
     * Reverse index of the declarations.
     * 
     * @readonly
     * @type {(DeclarationInfoIndex | undefined)}
     * @memberof DeclarationIndex
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
     * @memberof DeclarationIndex
     */
    public get declarationInfos(): DeclarationInfo[] {
        return Object
            .keys(this.index)
            .sort()
            .reduce((all, key) => all.concat(this.index![key]), <DeclarationInfo[]>[]);
    }

    constructor(
        @inject(iocSymbols.loggerFactory) loggerFactory: LoggerFactory,
        private parser: TypescriptParser,
    ) {
        this.logger = loggerFactory('DeclarationIndex');
        this.logger.info('Instantiated.');
    }

    /**
     * Resets the whole index. Does delete everything. Period.
     * Is useful for unit testing or similar things.
     * 
     * @memberof DeclarationIndex
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
     * @memberof DeclarationIndex
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
     * Is called when file events happen. Does reindex for the changed files and creates a new index.
     * 
     * @param {FileEvent[]} changes
     * @returns {Promise<void>}
     * 
     * @memberof DeclarationIndex
     */
    public async reindexForChanges(changes: FileEvent[], rootPath: string): Promise<void> {
        const rebuildResources: string[] = [];
        const removeResources: string[] = [];
        const rebuildFiles: string[] = [];

        for (const change of changes) {
            const filePath = normalizePathUri(change.uri);
            const resource = '/' + relative(rootPath, filePath).replace(/[.]tsx?/g, '');

            if (change.type === FileChangeType.Deleted) {
                if (removeResources.indexOf(resource) < 0) {
                    removeResources.push(resource);
                }
            } else {
                if (rebuildResources.indexOf(resource) < 0) {
                    rebuildResources.push(resource);
                }
                if (rebuildFiles.indexOf(filePath) < 0) {
                    rebuildFiles.push(filePath);
                }
            }

            for (const file of this.getExportedResources(resource, rootPath)) {
                if (rebuildFiles.indexOf(file) < 0) {
                    rebuildFiles.push(file);
                }
            }
        }

        this.logger.info('Files have changed, going to rebuild', {
            update: rebuildResources,
            delete: removeResources,
            reindex: rebuildFiles,
        });

        const resources = await this.parseResources(rootPath, await this.parser.parseFiles(rebuildFiles, rootPath));
        for (const del of removeResources) {
            delete this.parsedResources[del];
        }
        for (const key of Object.keys(resources)) {
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
     * @memberof DeclarationIndex
     */
    private getExportedResources(resourceToCheck: string, rootPath: string): string[] {
        const resources: string[] = [];
        Object
            .keys(this.parsedResources)
            .filter(o => o.startsWith('/'))
            .forEach((key) => {
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
     * @memberof DeclarationIndex
     */
    private doesExportResource(resource: File, resourcePath: string, rootPath: string): boolean {
        let exportsResource = false;

        for (const ex of resource.exports) {
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
     * @memberof DeclarationIndex
     */
    private async parseResources(rootPath: string, files: File[] = []): Promise<Resources> {
        const parsedResources: Resources = Object.create(null);

        for (const file of files) {
            if (file.filePath.indexOf('typings') > -1 || file.filePath.indexOf('node_modules/@types') > -1) {
                for (const resource of file.resources) {
                    parsedResources[resource.identifier] = resource;
                }
            } else if (file.filePath.indexOf('node_modules') > -1) {
                const libname = getNodeLibraryName(file.filePath);
                parsedResources[libname] = file;
            } else {
                parsedResources[file.identifier] = file;
            }
        }

        for (const key of Object.keys(parsedResources).sort((k1, k2) => k2.length - k1.length)) {
            const resource = parsedResources[key];
            resource.declarations = resource.declarations.filter(
                o => isExportableDeclaration(o) && o.isExported,
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
     * @memberof DeclarationIndex
     */
    private async createIndex(resources: Resources): Promise<DeclarationInfoIndex> {
        // Use an empty object without a prototype, so that "toString" (for example) can be indexed
        // Thanks to @gund in https://github.com/buehler/typescript-hero/issues/79
        const index: DeclarationInfoIndex = Object.create(null);

        for (const key of Object.keys(resources)) {
            const resource = resources[key];
            if (resource instanceof Namespace || resource instanceof Module) {
                if (!index[resource.name]) {
                    index[resource.name] = [];
                }
                index[resource.name].push(new DeclarationInfo(
                    new ModuleDeclaration(resource.getNamespaceAlias(), resource.start, resource.end),
                    resource.name,
                ));
            }
            for (const declaration of resource.declarations) {
                if (!index[declaration.name]) {
                    index[declaration.name] = [];
                }
                const from = key.replace(/[/]?index$/, '') || '/';
                if (!index[declaration.name].some(
                    o => o.declaration.constructor === declaration.constructor && o.from === from,
                )) {
                    index[declaration.name].push(new DeclarationInfo(declaration, from));
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
     * @memberof DeclarationIndex
     */
    private processResourceExports(
        rootPath: string,
        parsedResources: Resources,
        resource: Resource,
        processedResources: Resource[] = [],
    ): void {
        if (processedResources.indexOf(resource) >= 0 || resource.exports.length === 0) {
            return;
        }
        processedResources.push(resource);

        for (const ex of resource.exports) {
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

                const exportedLib = parsedResources[sourceLib];
                this.processResourceExports(rootPath, parsedResources, exportedLib, processedResources);

                if (ex instanceof AllExport) {
                    this.processAllFromExport(resource, exportedLib);
                } else {
                    this.processNamedFromExport(ex, resource, exportedLib);
                }
            } else {
                if (ex instanceof AssignedExport) {
                    for (const lib of ex.exported.filter(o => !isExportableDeclaration(o))) {
                        this.processResourceExports(rootPath, parsedResources, lib as Resource, processedResources);
                    }
                    this.processAssignedExport(ex, resource);
                } else if (ex instanceof NamedExport && ex.from && parsedResources[ex.from]) {
                    this.processResourceExports(
                        rootPath, parsedResources, parsedResources[ex.from], processedResources,
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
     * @memberof DeclarationIndex
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
     * @memberof DeclarationIndex
     */
    private processNamedFromExport(
        tsExport: NamedExport,
        exportingLib: Resource,
        exportedLib: Resource,
    ): void {
        exportedLib.declarations
            .forEach((o) => {
                const ex = tsExport.specifiers.find(s => s.specifier === o.name);
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
     * @memberof DeclarationIndex
     */
    private processAssignedExport(
        tsExport: AssignedExport,
        exportingLib: Resource,
    ): void {
        tsExport.exported.forEach((exported) => {
            if (isExportableDeclaration(exported)) {
                exportingLib.declarations.push(exported);
            } else {
                exportingLib.declarations.push(
                    ...exported.declarations.filter(
                        o => isExportableDeclaration(o) && o.isExported,
                    ),
                );
                exported.declarations = [];
            }
        });
    }
}
