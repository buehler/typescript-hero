import {ExtensionConfig} from '../ExtensionConfig';
import {CommandQuickPickItem} from '../models/QuickPickItems';
import {TshCommand} from '../models/TshCommand';
import {Logger, LoggerFactory} from '../utilities/Logger';
import {BaseExtension} from './BaseExtension';
import {inject, injectable} from 'inversify';
import {commands, ExtensionContext, FileSystemWatcher, StatusBarAlignment, window, workspace} from 'vscode';

const DEBOUNCE = 1500;

@injectable()
export class RestartDebuggerExtension extends BaseExtension {
    private statusBarItem = window.createStatusBarItem(StatusBarAlignment.Left, 3);
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
        context.subscriptions.push(commands.registerCommand('typescriptHero.restartDebugger.toggle', () => {
            this.active = !this.active;
            this.configure();
        }));
        context.subscriptions.push(this.statusBarItem);
        this.statusBarItem.command = 'typescriptHero.restartDebugger.toggle';
        this.statusBarItem.show();
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
            this.statusBarItem.text = '$(pulse) $(check)';
            this.statusBarItem.tooltip = 'The restart is currently active. Click to deactivate.';
        } else if (!this.active && this.fileWatcher) {
            this.fileWatcher.dispose();
            this.fileWatcher = null;
            this.logger.info(`Deactivated.`);
            this.statusBarItem.text = '$(pulse) $(x)';
            this.statusBarItem.tooltip = 'The restart is currently deactivated. Click to deactivate.';
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
