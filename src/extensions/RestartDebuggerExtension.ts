import {ExtensionConfig} from '../ExtensionConfig';
import {CommandQuickPickItem} from '../models/CommandQuickPickItem';
import {BaseExtension} from './BaseExtension';
import {inject, injectable} from 'inversify';
import {commands, ExtensionContext, FileSystemWatcher, workspace} from 'vscode';

const DEBOUNCE = 1500;

@injectable()
export class RestartDebuggerExtension extends BaseExtension {
    private fileWatcher: FileSystemWatcher;
    private restartCall: number;

    // TODO: on config change -> recreate filewatcher; may be even deactivate stuff.
    // TODO: in "gui" add possibility to toggle for the session    
    constructor( @inject('context') context: ExtensionContext, private config: ExtensionConfig) {
        super();
        console.log('RestartDebuggerExtension instantiated');
        if (this.config.restartDebugger.active) {
            let watcherGlob = this.config.restartDebugger.watchFolders.map(o => `**/${o}/**/*.*`).join(',');
            console.log(`RestartDebuggerExtension activated for glob: ${watcherGlob}`);
            this.fileWatcher = workspace.createFileSystemWatcher(`{${watcherGlob}}`);
            this.fileWatcher.onDidChange(() => this.restartDebugger());
            this.fileWatcher.onDidCreate(() => this.restartDebugger());
            this.fileWatcher.onDidDelete(() => this.restartDebugger());
            context.subscriptions.push(this.fileWatcher);
        }
    }

    public getGuiCommands(): CommandQuickPickItem[] {
        return [];
    }

    public dispose(): void { }

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
