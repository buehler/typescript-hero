import {ExtensionConfig} from '../ExtensionConfig';
import {CancellationRequested} from '../models/CancellationRequested';
import {TsDeclaration} from '../models/TsDeclaration';
import {TsFile, TsResource} from '../models/TsResource';
import {TsResourceParser} from '../parser/TsResourceParser';
import {Logger, LoggerFactory} from '../utilities/Logger';
import {existsSync} from 'fs';
import {inject, injectable} from 'inversify';
import {join, sep} from 'path';
import {CancellationToken, CancellationTokenSource, Uri, workspace} from 'vscode';

type DeclarationInfo = { declaration: TsDeclaration, from: string };
type ResourceIndex = { [declaration: string]: DeclarationInfo[] };

@injectable()
export class ResolveIndex {
    private logger: Logger;
    private cancelToken: CancellationTokenSource;

    private parsedResources: TsResource[] = [];
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

    private createIndex(files: TsFile[]): Promise<void>{
        this.parsedResources = [];
        return new Promise<void>((resolve, reject) => {
            let index: ResourceIndex = {};
            for (let file of files) {
                this.parsedResources.push(file);

                for (let resource of file.resources) {
                    this.parsedResources.push(resource);
                }
            }


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
