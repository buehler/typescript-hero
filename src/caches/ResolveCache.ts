import {TsResolveFile} from '../models/TsResolveFile';
import {TsResolveFileParser} from '../parser/TsResolveFileParser';
import fs = require('fs');
import * as inversify from 'inversify';
import * as path from 'path';
import * as vscode from 'vscode';

@inversify.injectable()
export class ResolveCache {
    private cache: { [path: string]: TsResolveFile };
    private cancelToken: vscode.CancellationTokenSource;

    public get cacheReady(): boolean {
        return !!this.cache;
    }

    public get cachedFiles(): TsResolveFile[] {
        return Object.keys(this.cache).reduce((all, cur) => {
            all.push(this.cache[cur]);
            return all;
        }, []);
    }

    constructor(private parser: TsResolveFileParser) { }

    public removeForFile(file: vscode.Uri): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            let parsed = path.parse(file.fsPath);
            delete this.cache[path.format(parsed)];
            resolve();
        });
    }

    public rebuildForFile(file: vscode.Uri): Promise<void> {
        console.log('ResolveCache: Rebuild index for file triggered. Indexing file: ' + file.fsPath);
        return this.parser
            .parseFile(file)
            .then(parsed => {
                console.log('ResolveCache: Rebuild for file finished.');
                this.cache[parsed.fsPath] = parsed;
            });
    }

    public buildCache(): Promise<void> {
        if (this.cancelToken) {
            console.log('ResolveCache: Refresh already running, canceling first.');
            this.cancelRefresh();
        }

        console.log('ResolveCache: Starting cache refresh.');
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
                console.log(`ResolveCache: Found ${uris.reduce((sum, cur) => sum + cur.length, 0)} files.`);
                return this.parser.parseFiles(uris.reduce((all, cur) => all.concat(cur), []));
            })
            .then(resolveFiles => {
                console.log(`ResolveCache: Refresh finished. Parsed ${resolveFiles.length} files.`);
                this.cache = {};
                resolveFiles.forEach(o => {
                    this.cache[o.fsPath] = o;
                });
                this.cancelToken.dispose();
                this.cancelToken = null;
            });
    }

    public cancelRefresh(): void {
        if (this.cancelToken) {
            console.log('ResolveCache: Canceling refresh.');
            this.cancelToken.dispose();
            this.cancelToken = null;
        }
    }

    public getResolveFileForPath(filePath: vscode.Uri): TsResolveFile {
        let parsed = path.parse(filePath.fsPath);
        return this.cache.find(o => o.path.dir === parsed.dir && o.path.base === parsed.base);
    }
}
