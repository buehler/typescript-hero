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










@injectable()
export class ResolveIndex {
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

    

    
}
