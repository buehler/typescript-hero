import {ExtensionConfig} from '../ExtensionConfig';
import {CancellationRequested} from '../models/CancellationRequested';
import {TsDeclaration, TsExportableDeclaration} from '../models/TsDeclaration';
import {TsAllFromExport, TsFromExport, TsNamedFromExport} from '../models/TsExport';
import {TsFile, TsModule, TsNamespace, TsResource} from '../models/TsResource';
import {TsResourceParser} from '../parser/TsResourceParser';
import {Logger, LoggerFactory} from '../utilities/Logger';
import {existsSync} from 'fs';
import {inject, injectable} from 'inversify';
import {join, resolve, sep} from 'path';
import {CancellationToken, CancellationTokenSource, Uri, workspace} from 'vscode';

type DeclarationInfo = { declaration: TsDeclaration, from: string };
type ResourceIndex = { [declaration: string]: DeclarationInfo[] };
type Resources = { [name: string]: TsResource };

function getNodeLibraryName(path: string): string {
    let dirs = path.split(sep),
        nodeIndex = dirs.indexOf('node_modules');
    return dirs.slice(nodeIndex + 1).join('/').replace(/([.]d)?([.]ts)?/g, '').replace('/index', '');
}

@injectable()
export class ResolveIndex {
    private logger: Logger;
    private cancelToken: CancellationTokenSource;

    private parsedResources: Resources = {};
    private index: ResourceIndex = {};

    constructor( @inject('LoggerFactory') loggerFactory: LoggerFactory, private parser: TsResourceParser, private config: ExtensionConfig) {
        this.logger = loggerFactory('ResolveIndex');
    }

    public buildIndex(cancellationToken?: CancellationToken): Promise<void> {
        if (this.cancelToken) {
            this.logger.info('Refresh already running, canceling first.');
            this.cancelRefresh();
        }

        this.logger.info('Starting index refresh.');
        this.cancelToken = new CancellationTokenSource();

        return this.findFiles(cancellationToken)
            .then(files => {
                if (cancellationToken && cancellationToken.onCancellationRequested) {
                    throw new CancellationRequested();
                }
                this.logger.info(`Finding finished. Found ${files.length} files.`);

                return this.parser.parseFiles(files);
            })
            .then(parsed => {
                if (cancellationToken && cancellationToken.onCancellationRequested) {
                    throw new CancellationRequested();
                }

                return this.createIndex(parsed);
            })
            .then(() => {
                this.cancelToken.dispose();
                this.cancelToken = null;
            })
            .catch(e => {
                if (!(e instanceof CancellationRequested)) {
                    throw e;
                }
                this.logger.info('Cancellation requested.');
            });
    }

    public rebuildForFile(filePath: string): Promise<void> {
        return null;
    }

    public removeForFile(filePath: string): Promise<void> {
        return null;
    }

    public cancelRefresh(): void {
        if (this.cancelToken) {
            this.logger.info('Canceling refresh.');
            this.cancelToken.dispose();
            this.cancelToken = null;
        }
    }

    private createIndex(files: TsFile[]): Promise<void> {
        return new Promise<void>(
            resolve => {
                this.parsedResources = {};
                for (let file of files) {
                    if (file.filePath.indexOf('node_modules') > -1) {
                        let libname = getNodeLibraryName(file.filePath);
                        this.parsedResources[libname] = file;
                    } else if (file.filePath.indexOf('typings') > -1) {
                        for (let resource of file.resources) {
                            this.parsedResources[resource.getIdentifier()] = resource;
                        }
                    } else {
                        this.parsedResources[file.getIdentifier()] = file;
                    }
                }
                resolve();
            })
            .then(() => Object
                .keys(this.parsedResources)
                .sort((k1, k2) => k2.length - k1.length)
                .forEach(key => {
                    let resource = this.parsedResources[key];
                    //TODO maybe not filter all non exported?
                    resource.declarations = resource.declarations.filter(o => o instanceof TsExportableDeclaration && o.isExported);
                    this.processResourceExports(resource);
                })
            )
            .then(() => {
                console.log(this.parsedResources);
            });
    }

    private processResourceExports(resource: TsResource): void {
        for (let ex of resource.exports) {
            if (resource instanceof TsFile && ex instanceof TsFromExport) {
                if (!ex.from) {
                    return;
                }

                let sourceLib = resolve(resource.parsedPath.dir, ex.from);
                if (sourceLib.indexOf('node_modules') > -1) {
                    sourceLib = getNodeLibraryName(sourceLib);
                } else {
                    sourceLib = workspace.asRelativePath(sourceLib).replace(/([.]d)?[.]ts/g, '');
                }

                if (!this.parsedResources[sourceLib]) {
                    return;
                }

                if (ex instanceof TsAllFromExport) {
                    this.processAllFromExport(resource, this.parsedResources[sourceLib]);
                } else if (ex instanceof TsNamedFromExport) {
                    this.processNamedFromExport(ex, resource, this.parsedResources[sourceLib]);
                }
            }
        }
    }

    private processAllFromExport(exportingLib: TsResource, exportedLib: TsResource): void {
        this.processResourceExports(exportedLib);

        exportingLib.declarations.push(...exportedLib.declarations);
        exportedLib.declarations = [];
    }

    private processNamedFromExport(tsExport: TsNamedFromExport, exportingLib: TsResource, exportedLib: TsResource): void {
        this.processResourceExports(exportedLib);

        exportedLib.declarations
            .filter(o => tsExport.specifiers.some(s => s.specifier === o.name))
            .forEach(o => {
                //TODO export ... as ... from ...;
                exportedLib.declarations.splice(exportedLib.declarations.indexOf(o), 1);
                exportingLib.declarations.push(o);
            });
    }

    private findFiles(cancellationToken: CancellationToken): Promise<Uri[]> {
        let searches: PromiseLike<Uri[]>[] = [workspace.findFiles('**/*.ts', '{**/node_modules/**,**/typings/**}', undefined, cancellationToken)];

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

        return Promise
            .all(searches)
            .then(uris => {
                if (cancellationToken && cancellationToken.onCancellationRequested) {
                    throw new CancellationRequested();
                }
                let excludePatterns = this.config.resolver.ignorePatterns;
                uris = uris.map(o => o.filter(f => f.fsPath.split(sep).every(p => excludePatterns.indexOf(p) < 0)));
                this.logger.info(`Found ${uris.reduce((sum, cur) => sum + cur.length, 0)} files.`);
                return uris.reduce((all, cur) => all.concat(cur), []);
            });
    }
}
