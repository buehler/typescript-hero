import * as inversify from 'inversify';
import {TsResolveFileParser} from '../parser/TsResolveFileParser';
import {TsResolveFile} from '../models/TsResolveFile';
import * as vscode from 'vscode';
import fs = require('fs');
import path = require('path');

@inversify.injectable()
export class ResolveCache {
    private cache: TsResolveFile[];
    private cancelToken: vscode.CancellationTokenSource;

    public get cacheReady(): boolean {
        return !!this.cache;
    }

    constructor(private parser: TsResolveFileParser) {
        this.refreshCache();
    }

    public refreshCache(): Promise<void> {
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
                this.cache = resolveFiles;
            });
    }

    public cancelRefresh(): void {
        if (this.cancelToken) {
            console.log('ResolveCache: Canceling refresh.');
            this.cancelToken.dispose();
            this.cancelToken = null;
        }
    }
}
