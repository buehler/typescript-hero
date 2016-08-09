import {ExtensionConfig} from '../ExtensionConfig';
import {CancellationRequested} from '../models/CancellationRequested';
import {TsResolveFile} from '../models/TsResolveFile';
import {TsResolveFileParser} from '../parser/TsResolveFileParser';
import {Logger, LoggerFactory} from '../utilities/Logger';
import fs = require('fs');
import {inject, injectable} from 'inversify';
import * as path from 'path';
import * as vscode from 'vscode';

@injectable()
export class ResolveCache {
    private cache: { [path: string]: TsResolveFile };
    private cancelToken: vscode.CancellationTokenSource;
    private logger: Logger;

    public get cacheReady(): boolean {
        return !!this.cache;
    }

    public get cachedCount(): number {
        return Object.keys(this.cache).length;
    }

    public get cachedFiles(): TsResolveFile[] {
        return Object.keys(this.cache).reduce((all, cur) => {
            all.push(this.cache[cur]);
            return all;
        }, []);
    }

    constructor( @inject('LoggerFactory') loggerFactory: LoggerFactory, private parser: TsResolveFileParser, private config: ExtensionConfig) {
        this.logger = loggerFactory('ResolveCache');
    }

    public removeForFile(file: vscode.Uri): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            let parsed = path.parse(file.fsPath);
            delete this.cache[path.format(parsed)];
            resolve();
        });
    }

    public rebuildForFile(file: vscode.Uri): Promise<void> {
        this.logger.info('Rebuild index for file triggered.', { path: file.fsPath });
        return this.parser
            .parseFile(file)
            .then(parsed => {
                this.logger.info('Rebuild for file finished.');
                this.cache[parsed.fsPath] = parsed;
            });
    }

    public buildCache(cancellationToken?: vscode.CancellationToken): Promise<void> {
        if (this.cancelToken) {
            this.logger.info('Refresh already running, canceling first.');
            this.cancelRefresh();
        }

        this.logger.info('Starting cache refresh.');
        this.cancelToken = new vscode.CancellationTokenSource();
        let searches: PromiseLike<vscode.Uri[]>[] = [vscode.workspace.findFiles('**/*.ts', '{**/node_modules/**,**/typings/**}', undefined, this.cancelToken.token)];

        let globs = [],
            ignores = ['**/typings/**'];
        if (vscode.workspace.rootPath && fs.existsSync(path.join(vscode.workspace.rootPath, 'package.json'))) {
            let packageJson = require(path.join(vscode.workspace.rootPath, 'package.json'));
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
        searches.push(vscode.workspace.findFiles(`{${globs.join(',')}}`, `{${ignores.join(',')}}`, undefined, this.cancelToken.token));

        searches.push(vscode.workspace.findFiles('**/typings/**/*.d.ts', '**/node_modules/**', undefined, this.cancelToken.token));

        return Promise
            .all(searches)
            .then(uris => {
                if (cancellationToken && cancellationToken.onCancellationRequested) {
                    throw new CancellationRequested();
                }
                let excludePatterns = this.config.resolver.ignorePatterns;
                uris = uris.map(o => o.filter(f => f.fsPath.split(path.sep).every(p => excludePatterns.indexOf(p) < 0)));
                this.logger.info(`Found ${uris.reduce((sum, cur) => sum + cur.length, 0)} files.`);
                return this.parser.parseFiles(uris.reduce((all, cur) => all.concat(cur), []), cancellationToken);
            })
            .then(resolveFiles => {
                if (cancellationToken && cancellationToken.onCancellationRequested) {
                    throw new CancellationRequested();
                }
                this.logger.info(`Refresh finished. Parsed ${resolveFiles.length} files.`);
                this.cache = {};
                resolveFiles.forEach(o => {
                    this.cache[o.fsPath] = o;
                });
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

    public cancelRefresh(): void {
        if (this.cancelToken) {
            this.logger.info('Canceling refresh.');
            this.cancelToken.dispose();
            this.cancelToken = null;
        }
    }

    public getResolveFileForPath(filePath: vscode.Uri): TsResolveFile {
        let parsed = path.parse(filePath.fsPath);
        return this.cache[path.format(parsed)];
    }
}
