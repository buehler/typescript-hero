import { inject, injectable } from 'inversify';
import { DeclarationIndex, TypescriptParser } from 'typescript-parser';
import {
    ExtensionContext,
    FileSystemWatcher,
    RelativePattern,
    workspace,
    WorkspaceFolder,
    WorkspaceFoldersChangeEvent,
} from 'vscode';

import { ExtensionConfig } from '../../common/config';
import { findFiles } from '../../common/helpers';
import { Logger, LoggerFactory } from '../../common/utilities';
import { iocSymbols } from '../../extension/IoCSymbols';
import { BaseExtension } from './BaseExtension';

// const parser = context.container.get<TypescriptParser>(iocSymbols.typescriptParser);
// return new DeclarationIndex(parser, context.container.get<string>(iocSymbols.rootPath));

/*
1. pro rootpath 1 index
2. build index
3. add workspace changed thingy pro index
spöter:
4. luege öbs im gliche folder isch zum imports etc resolve
*/

interface WorkspaceIndex {
    index: DeclarationIndex;
    folder: WorkspaceFolder;
    watcher: FileSystemWatcher;
}

@injectable()
export class DeclarationIndexMapperExtension extends BaseExtension {
    protected context: ExtensionContext;
    private logger: Logger;
    private indizes: { [uri: string]: WorkspaceIndex } = {};

    constructor(
        @inject(iocSymbols.extensionContext) context: ExtensionContext,
        @inject(iocSymbols.loggerFactory) loggerFactory: LoggerFactory,
        @inject(iocSymbols.typescriptParser) private parser: TypescriptParser,
        @inject(iocSymbols.configuration) private config: ExtensionConfig,
    ) {
        super(context);
        this.logger = loggerFactory('DeclarationIndexMapper');
    }

    public initialize(): void {
        this.context.subscriptions.push(workspace.onDidChangeWorkspaceFolders(e => this.workspaceChanged(e)));
        this.logger.info(
            `Fired up index mapper, got ${(workspace.workspaceFolders || []).length} workspaces.`,
            workspace.workspaceFolders,
        );
        for (const folder of (workspace.workspaceFolders || []).filter(workspace => workspace.uri.scheme === 'file')) {
            this.initializeIndex(folder);
        }
        this.logger.info('Initialized');
    }

    public dispose(): void {
        for (const index of Object.values(this.indizes)) {
            index.watcher.dispose();
            index.index.reset();
        }
        this.indizes = {};
    }

    public getIndexForFile(fileUri: string): DeclarationIndex {
        return '' as any;
    }

    private workspaceChanged(event: WorkspaceFoldersChangeEvent): void {
        this.logger.info('Workspaces changed.', event);
        for (const add of event.added) {
            if (this.indizes[add.uri.path]) {
                this.logger.warning(`The workspace with the path ${add.uri.path} already exists. Skipping.`);
                continue;
            }
            this.initializeIndex(add);
        }

        for (const remove of event.removed) {
            this.indizes[remove.uri.path].index.reset();
            this.indizes[remove.uri.path].watcher.dispose();
            delete this.indizes[remove.uri.path];
        }
    }

    private async initializeIndex(folder: WorkspaceFolder): Promise<void> {
        const index = new DeclarationIndex(this.parser, folder.uri.path);
        const files = await findFiles(this.config, folder);
        const watcher = workspace.createFileSystemWatcher(
            new RelativePattern(
                folder,
                `{${this.config.resolver.resolverModeFileGlobs.join(',')},**/package.json,**/typings.json}`,
            ),
        );
        // watcher.onDidChange()
        await index.buildIndex(files);
        this.indizes[folder.uri.path] = {
            index,
            folder,
            watcher,
        };
        this.logger.info(`Finished building index for workspace "${folder.name}".`);
    }
}
