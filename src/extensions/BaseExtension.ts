import {CommandQuickPickItem} from '../models/CommandQuickPickItem';
import {injectable} from 'inversify';
import {Disposable, ExtensionContext} from 'vscode';

@injectable()
export abstract class BaseExtension implements Disposable {
    public abstract getGuiCommands(): CommandQuickPickItem[];
    public abstract initialize(context: ExtensionContext): void;
    public abstract dispose(): void;
}
