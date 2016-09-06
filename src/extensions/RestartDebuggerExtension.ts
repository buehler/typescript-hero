import {ExtensionConfig} from '../ExtensionConfig';
import {CommandQuickPickItem} from '../models/QuickPickItems';
import {TshCommand} from '../models/TshCommand';
import {Logger, LoggerFactory} from '../utilities/Logger';
import {BaseExtension} from './BaseExtension';
import {inject, injectable} from 'inversify';
import {commands, ExtensionContext, FileSystemWatcher, workspace} from 'vscode';

const DEBOUNCE = 1500;

@injectable()
export class RestartDebuggerExtension extends BaseExtension {
    private fileWatcher: FileSystemWatcher;
    private logger: Logger;
    private restartCall: number;
    private active: boolean;

    constructor( @inject('LoggerFactory') loggerFactory: LoggerFactory, private config: ExtensionConfig) {
        super();
        this.logger = loggerFactory('RestartDebuggerExtension');
        this.active = this.config.restartDebugger.active;
        this.logger.info('Extension instantiated.');
    }

    public getGuiCommands(): CommandQuickPickItem[] {
        return [
            new CommandQuickPickItem(
                'Debug restarter: Toggle',
                `currently: ${this.active ? 'activated' : 'deactivated'}`,
                'Toggles the active state of the automatic debug restarter.',
                new TshCommand(() => {
                    this.active = !this.active;
                    this.configure();
                })
            )
        ];
    }

    public initialize(context: ExtensionContext): void {
        this.configure();
        this.logger.info('Initialized.');
    }

    public dispose(): void {
        this.logger.info('Dispose called.');
        if (this.fileWatcher) {
            this.fileWatcher.dispose();
            this.fileWatcher = null;
        }
    }

    private configure(): void {
        if (this.active && !this.fileWatcher) {
            let watcherGlob = this.config.restartDebugger.watchFolders.map(o => `**/${o}/**/*.*`).join(',');
            this.logger.info(`Activated for glob: ${watcherGlob}.`);
            this.fileWatcher = workspace.createFileSystemWatcher(`{${watcherGlob}}`);
            this.fileWatcher.onDidChange(() => this.restartDebugger());
            this.fileWatcher.onDidCreate(() => this.restartDebugger());
            this.fileWatcher.onDidDelete(() => this.restartDebugger());
        } else if (!this.active && this.fileWatcher) {
            this.fileWatcher.dispose();
            this.fileWatcher = null;
            this.logger.info(`Deactivated.`);
        }
    }

    private restartDebugger(): void {
        if (this.restartCall) {
            clearTimeout(this.restartCall);
            delete this.restartCall;
        }
        this.restartCall = setTimeout(() => {
            commands.executeCommand('workbench.action.debug.restart');
        }, DEBOUNCE);
    }
}
