import {ExtensionConfig} from '../ExtensionConfig';
import {ModuleDeclaration, TsDeclaration, TsExportableDeclaration} from '../models/TsDeclaration';
import {TsAllFromExport, TsAssignedExport, TsFromExport, TsNamedFromExport} from '../models/TsExport';
import {TsFile, TsModule, TsNamedResource, TsNamespace, TsResource} from '../models/TsResource';
import {TsResourceParser} from '../parser/TsResourceParser';
import {Logger, LoggerFactory} from '../utilities/Logger';
import {existsSync} from 'fs';
import {inject, injectable} from 'inversify';
import {join, normalize, resolve, sep} from 'path';
import {CancellationToken, CancellationTokenSource, Uri, workspace} from 'vscode';

export type DeclarationInfo = { declaration: TsDeclaration, from: string };
export type ResourceIndex = { [declaration: string]: DeclarationInfo[] };
type Resources = { [name: string]: TsResource };

function getNodeLibraryName(path: string): string {
    let dirs = path.split(sep),
        nodeIndex = dirs.indexOf('node_modules');
    return dirs.slice(nodeIndex + 1).join('/').replace(/([.]d)?([.]tsx?)?/g, '').replace('/index', '');
}

@injectable()
export class ResolveIndex {
    private logger: Logger;
    private cancelToken: CancellationTokenSource;

    private parsedResources: Resources;
    private _index: ResourceIndex;

    public get indexReady(): boolean {
        return !!this._index;
    }

    public get index(): ResourceIndex {
        return this._index;
    }

    public get declarationInfos(): DeclarationInfo[] {
        return Object
            .keys(this.index)
            .sort()
            .reduce((all, key) => all.concat(this.index[key]), []);
    }

    constructor( @inject('LoggerFactory') loggerFactory: LoggerFactory, private parser: TsResourceParser, private config: ExtensionConfig) {
        this.logger = loggerFactory('ResolveIndex');
    }

    public async buildIndex(cancellationToken?: CancellationToken): Promise<void> {
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
                return;
            }

            this.logger.info(`Finding finished. Found ${files.length} files.`);

            let parsed = await this.parser.parseFiles(files);

            if (cancellationToken && cancellationToken.onCancellationRequested) {
                this.cancelRequested();
                return;
            }

            this.parsedResources = await this.parseResources(parsed, cancellationToken);
            this._index = await this.createIndex(this.parsedResources, cancellationToken);
        } catch (e) {
            this.logger.error('Catched an error during buildIndex()', e);
        } finally {
            this.cancelToken.dispose();
            this.cancelToken = null;
        }

    }

    public async rebuildForFile(filePath: string): Promise<void> {
        let rebuildResource = '/' + workspace.asRelativePath(filePath).replace(/[.]tsx?/g, ''),
            rebuildFiles = [<Uri>{ fsPath: filePath }, ...this.getExportedResources(rebuildResource)];

        try {
            let resources = await this.parseResources(await this.parser.parseFiles(rebuildFiles));

            for (let key in resources) {
                this.parsedResources[key] = resources[key];
            }
            this._index = await this.createIndex(this.parsedResources);
        } catch (e) {
            this.logger.error('Catched an error during rebuildForFile()', e);
        }
    }

    public async removeForFile(filePath: string): Promise<void> {
        let removeResource = '/' + workspace.asRelativePath(filePath).replace(/[.]tsx?/g, ''),
            rebuildFiles = this.getExportedResources(removeResource);

        try {
            let resources = await this.parseResources(await this.parser.parseFiles(rebuildFiles));

            delete this.parsedResources[removeResource];
            for (let key in resources) {
                this.parsedResources[key] = resources[key];
            }
            this._index = await this.createIndex(this.parsedResources);
        } catch (e) {
            this.logger.error('Catched an error during removeForFile()', e);
        }
    }

    public cancelRefresh(): void {
        if (this.cancelToken) {
            this.logger.info('Canceling refresh.');
            this.cancelToken.dispose();
            this.cancelToken = null;
        }
    }

    public reset(): void {
        this.parsedResources = null;
        this._index = null;
    }

    private async parseResources(files: TsFile[], cancellationToken?: CancellationToken): Promise<Resources> {
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
            resource.declarations = resource.declarations.filter(o => o instanceof TsExportableDeclaration && o.isExported);
            this.processResourceExports(parsedResources, resource);
        }

        return parsedResources;
    }

    private async createIndex(resources: Resources, cancellationToken?: CancellationToken): Promise<ResourceIndex> {
        if (cancellationToken && cancellationToken.onCancellationRequested) {
            this.cancelRequested();
            return;
        }

        let index: ResourceIndex = {};

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
                index[declaration.name].push({
                    declaration,
                    from: key.replace(/[/]?index$/, '')
                });
            }
        }
        return index;
    }

    private processResourceExports(parsedResources: Resources, resource: TsResource): void {
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

                if (ex instanceof TsAllFromExport) {
                    this.processAllFromExport(parsedResources, resource, parsedResources[sourceLib]);
                } else if (ex instanceof TsNamedFromExport) {
                    this.processNamedFromExport(parsedResources, ex, resource, parsedResources[sourceLib]);
                }
            } else if (resource instanceof TsModule || resource instanceof TsNamespace) {
                if (ex instanceof TsAssignedExport) {
                    this.processAssignedExport(parsedResources, ex, resource);
                } else if (ex instanceof TsNamedFromExport && ex.from && parsedResources[ex.from]) {
                    this.processNamedFromExport(parsedResources, ex, resource, parsedResources[ex.from]);
                }
            }
        }
    }

    private processAllFromExport(parsedResources: Resources, exportingLib: TsResource, exportedLib: TsResource): void {
        this.processResourceExports(parsedResources, exportedLib);

        exportingLib.declarations.push(...exportedLib.declarations);
        exportedLib.declarations = [];
    }

    private processNamedFromExport(parsedResources: Resources, tsExport: TsNamedFromExport, exportingLib: TsResource, exportedLib: TsResource): void {
        this.processResourceExports(parsedResources, exportedLib);

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

    private processAssignedExport(parsedResources: Resources, tsExport: TsAssignedExport, exportingLib: TsResource): void {
        tsExport.exported.forEach(exported => {
            if (exported instanceof TsExportableDeclaration) {
                exportingLib.declarations.push(exported);
            } else {
                this.processResourceExports(parsedResources, exported);
                exportingLib.declarations.push(...exported.declarations.filter(o => o instanceof TsExportableDeclaration && o.isExported));
                exported.declarations = [];
            }
        });
    }

    private async findFiles(cancellationToken: CancellationToken): Promise<Uri[]> {
        let searches: PromiseLike<Uri[]>[] = [workspace.findFiles('{**/*.ts,**/*.tsx}', '{**/node_modules/**,**/typings/**}', undefined, cancellationToken)];

        let globs = [],
            ignores = ['**/typings/**'];

        if (workspace.rootPath && existsSync(join(workspace.rootPath, 'package.json'))) {
            let packageJson = require(join(workspace.rootPath, 'package.json'));
            if (packageJson['dependencies']) {
                globs = globs.concat(Object.keys(packageJson['dependencies']).map(o => `**/node_modules/${o}/**/*.d.ts`));
                ignores = ignores.concat(Object.keys(packageJson['dependencies']).map(o => `**/node_modules/${o}/node_modules/**`));
            }
            if (packageJson['devDependencies']) {
                globs = globs.concat(Object.keys(packageJson['devDependencies']).map(o => `**/node_modules/${o}/**/*.d.ts`));
                ignores = ignores.concat(Object.keys(packageJson['devDependencies']).map(o => `**/node_modules/${o}/node_modules/**`));
            }
        } else {
            globs.push('**/node_modules/**/*.d.ts');
        }
        searches.push(workspace.findFiles(`{${globs.join(',')}}`, `{${ignores.join(',')}}`, undefined, cancellationToken));

        searches.push(workspace.findFiles('**/typings/**/*.d.ts', '**/node_modules/**', undefined, cancellationToken));

        let uris = await Promise.all(searches);
        if (cancellationToken && cancellationToken.onCancellationRequested) {
            this.cancelRequested();
            return;
        }
        let excludePatterns = this.config.resolver.ignorePatterns;
        uris = uris.map(o => o.filter(f => f.fsPath.split(sep).every(p => excludePatterns.indexOf(p) < 0)));
        this.logger.info(`Found ${uris.reduce((sum, cur) => sum + cur.length, 0)} files.`);
        return uris.reduce((all, cur) => all.concat(cur), []);
    }

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

    private cancelRequested(): void {
        this.logger.info('Cancellation requested.');
    }
}
