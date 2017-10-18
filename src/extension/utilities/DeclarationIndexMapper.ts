import { inject, injectable, postConstruct } from 'inversify';
import { DeclarationIndex, FileChanges, TypescriptParser } from 'typescript-parser';
import {
    Event,
    EventEmitter,
    ExtensionContext,
    FileSystemWatcher,
    RelativePattern,
    Uri,
    workspace,
    WorkspaceFolder,
    WorkspaceFoldersChangeEvent,
} from 'vscode';

import { ExtensionConfig } from '../../common/config';
import { findFiles } from '../../common/helpers';
import { Logger, LoggerFactory } from '../../common/utilities';
import { iocSymbols } from '../../extension/IoCSymbols';

interface WorkspaceIndex {
    index: DeclarationIndex;
    folder: WorkspaceFolder;
    watcher: FileSystemWatcher;
}

// TODO documentation
// TODO change settings to scoped settings
// TODO move did change configuration to all indices
// TODO error handling of each index
// TODO events for indexing part

@injectable()
export class DeclarationIndexMapper {
    public readonly onStartIndexing: Event<WorkspaceIndex>;
    public readonly onFinishIndexing: Event<WorkspaceIndex>;
    public readonly onIndexingError: Event<{ index: WorkspaceIndex, error: Error }>;

    private _onStartIndexing: EventEmitter<WorkspaceIndex>;
    private _onFinishIndexing: EventEmitter<WorkspaceIndex>;
    private _onIndexingError: EventEmitter<{ index: WorkspaceIndex, error: Error }>;

    private logger: Logger;
    private indizes: { [uri: string]: WorkspaceIndex } = {};

    constructor(
        @inject(iocSymbols.loggerFactory) loggerFactory: LoggerFactory,
        @inject(iocSymbols.extensionContext) private context: ExtensionContext,
        @inject(iocSymbols.typescriptParser) private parser: TypescriptParser,
        @inject(iocSymbols.configuration) private config: ExtensionConfig,
    ) {
        this._onFinishIndexing = new EventEmitter();
        this._onStartIndexing = new EventEmitter();
        this._onIndexingError = new EventEmitter();

        this.onFinishIndexing = this._onFinishIndexing.event;
        this.onStartIndexing = this._onStartIndexing.event;
        this.onIndexingError = this._onIndexingError.event;

        this.context.subscriptions.push(this._onFinishIndexing);
        this.context.subscriptions.push(this._onIndexingError);
        this.context.subscriptions.push(this._onStartIndexing);

        this.logger = loggerFactory('DeclarationIndexMapper');
    }

    @postConstruct()
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

    public rebuildAll(): void {
        for (const index of Object.values(this.indizes)) {
            index.watcher.dispose();
            index.index.reset();
        }
        this.indizes = {};
        for (const folder of (workspace.workspaceFolders || []).filter(workspace => workspace.uri.scheme === 'file')) {
            this.initializeIndex(folder);
        }
    }

    public getIndexForFile(fileUri: Uri): DeclarationIndex | undefined {
        const workspaceFolder = workspace.getWorkspaceFolder(fileUri);
        if (!workspaceFolder || !this.indizes[workspaceFolder.uri.fsPath]) {
            return;
        }

        return this.indizes[workspaceFolder.uri.fsPath].index;
    }

    private workspaceChanged(event: WorkspaceFoldersChangeEvent): void {
        this.logger.info('Workspaces changed.', event);
        for (const add of event.added) {
            if (this.indizes[add.uri.fsPath]) {
                this.logger.warning(`The workspace with the path ${add.uri.fsPath} already exists. Skipping.`);
                continue;
            }
            this.initializeIndex(add);
        }

        for (const remove of event.removed) {
            this.indizes[remove.uri.fsPath].index.reset();
            this.indizes[remove.uri.fsPath].watcher.dispose();
            delete this.indizes[remove.uri.fsPath];
        }
    }

    private async initializeIndex(folder: WorkspaceFolder): Promise<void> {
        const index = new DeclarationIndex(this.parser, folder.uri.fsPath);
        const files = await findFiles(this.config, folder);
        const watcher = workspace.createFileSystemWatcher(
            new RelativePattern(
                folder,
                `{${this.config.resolver.resolverModeFileGlobs.join(',')},**/package.json,**/typings.json}`,
            ),
        );
        const workspaceIndex = {
            index,
            folder,
            watcher,
        };

        this._onStartIndexing.fire(workspaceIndex);

        let timeout: NodeJS.Timer | undefined;
        let events: FileChanges | undefined;

        const fileWatcherEvent = (event: string, uri: Uri) => {
            if (timeout) {
                clearTimeout(timeout);
            }
            if (!events) {
                events = {
                    created: [],
                    updated: [],
                    deleted: [],
                };
            }
            events[event].push(uri.fsPath);

            timeout = setTimeout(
                async () => {
                    if (events) {
                        this.logger.info(`Refreshing index for workspace ${folder.name}.`);
                        await index.reindexForChanges(events);
                        this.logger.info(`Finished indexing for workspace ${folder.name}.`);
                        events = undefined;
                    }
                },
                500,
            );
        };

        watcher.onDidCreate(uri => fileWatcherEvent('created', uri));
        watcher.onDidChange(uri => fileWatcherEvent('updated', uri));
        watcher.onDidDelete(uri => fileWatcherEvent('deleted', uri));

        try {
            await index.buildIndex(files);
            this.indizes[folder.uri.fsPath] = workspaceIndex;
            this.logger.info(`Finished building index for workspace "${folder.name}".`);
            this._onFinishIndexing.fire(workspaceIndex);
        } catch (error) {
            this.logger.error(`Error during build of index for workspace "${folder.name}"`, error);
            this._onIndexingError.fire({ error, index: workspaceIndex });
        }
    }
}
