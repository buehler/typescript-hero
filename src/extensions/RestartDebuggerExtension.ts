import {ExtensionConfig} from '../ExtensionConfig';
import {CommandQuickPickItem} from '../models/CommandQuickPickItem';
import {TshCommand} from '../models/TshCommand';
import {BaseExtension} from './BaseExtension';
import {inject, injectable} from 'inversify';
import {commands, ExtensionContext, FileSystemWatcher, workspace} from 'vscode';

const DEBOUNCE = 1500;

@injectable()
export class RestartDebuggerExtension extends BaseExtension {
    private fileWatcher: FileSystemWatcher;
    private restartCall: number;
    private active: boolean;

    constructor( @inject('context') context: ExtensionContext, private config: ExtensionConfig) {
        super();
        console.log('RestartDebuggerExtension instantiated');
        this.active = this.config.restartDebugger.active;
        this.configure();
    }

    public getGuiCommands(): CommandQuickPickItem[] {
        return [
            new CommandQuickPickItem(
                'Debug restarter: toggle',
                `currently: ${this.active ? 'activated' : 'deactivated'}`,
                'Toggles the active state of the automatic debug restarter.',
                new TshCommand(() => {
                    this.active = !this.active;
                    this.configure();
                })
            )
        ];
    }

    public dispose(): void {
        console.log('RestartDebuggerExtension: Dispose called.');
        if (this.fileWatcher) {
            this.fileWatcher.dispose();
            this.fileWatcher = null;
        }
    }

    private configure(): void {
        if (this.active && !this.fileWatcher) {
            let watcherGlob = this.config.restartDebugger.watchFolders.map(o => `**/${o}/**/*.*`).join(',');
            console.log(`RestartDebuggerExtension activated for glob: ${watcherGlob}`);
            this.fileWatcher = workspace.createFileSystemWatcher(`{${watcherGlob}}`);
            this.fileWatcher.onDidChange(() => this.restartDebugger());
            this.fileWatcher.onDidCreate(() => this.restartDebugger());
            this.fileWatcher.onDidDelete(() => this.restartDebugger());
        } else if (!this.active && this.fileWatcher) {
            this.fileWatcher.dispose();
            this.fileWatcher = null;
            console.log(`RestartDebuggerExtension deactivated`);
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
