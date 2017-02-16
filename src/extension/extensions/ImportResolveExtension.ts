import { ExtensionConfig } from '../../common/config';
import { Logger, LoggerFactory } from '../../common/utilities';
import { iocSymbols } from '../IoCSymbols';
import { BaseExtension } from './BaseExtension';
import { existsSync } from 'fs';
import { inject, injectable } from 'inversify';
import { join } from 'path';
import { ExtensionContext, Uri, workspace } from 'vscode';

/**
 * Search for typescript / typescript react files in the workspace and return the path to them.
 * This is needed for the initial load of the index.
 * 
 * @export
 * @param {ExtensionConfig} config
 * @returns {Promise<string[]>}
 */
export async function findFiles(config: ExtensionConfig): Promise<string[]> {
    const searches: PromiseLike<Uri[]>[] = [
        workspace.findFiles(
            '{**/*.ts,**/*.tsx}',
            '{**/node_modules/**,**/typings/**}'
        )
    ];

    let globs: string[] = [],
        ignores = ['**/typings/**'];

    if (workspace.rootPath && existsSync(join(workspace.rootPath, 'package.json'))) {
        const packageJson = require(join(workspace.rootPath, 'package.json'));
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
        workspace.findFiles(`{${globs.join(',')}}`, `{${ignores.join(',')}}`)
    );

    searches.push(
        workspace.findFiles('**/typings/**/*.d.ts', '**/node_modules/**')
    );

    let uris = await Promise.all(searches);

    const excludePatterns = config.resolver.ignorePatterns;
    uris = uris.map((o, idx) => idx === 0 ?
        o.filter(
            f => f.fsPath
                .replace(workspace.rootPath, '')
                .split(/\\|\//)
                .every(p => excludePatterns.indexOf(p) < 0)) :
        o
    );
    return uris.reduce((all, cur) => all.concat(cur), []).map(o => o.fsPath);
}

/**
 * Extension that resolves imports. Contains various actions to add imports to a document, add missing
 * imports and organize imports. Also can rebuild the symbol cache.
 * 
 * @export
 * @class ImportResolveExtension
 * @extends {BaseExtension}
 */
@injectable()
export class ImportResolveExtension extends BaseExtension {
    private logger: Logger;

    constructor(
        @inject(iocSymbols.extensionContext) context: ExtensionContext,
        @inject(iocSymbols.loggerFactory) loggerFactory: LoggerFactory
    ) {
        super(context);
        this.logger = loggerFactory('ImportResolveExtension');
    }

    /**
     * Initialized the extension. Registers the commands and other disposables to the context.
     * 
     * @memberOf ImportResolveExtension
     */
    public initialize(): void {
        this.logger.info('Initialized');
    }

    /**
     * Disposes the extension.
     * 
     * @memberOf ImportResolveExtension
     */
    public dispose(): void {
        this.logger.info('Disposed');
    }
}
