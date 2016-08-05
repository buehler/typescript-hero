import {CommandQuickPickItem} from '../models/CommandQuickPickItem';
import {injectable} from 'inversify';
import {Disposable} from 'vscode';

@injectable()
export abstract class BaseExtension implements Disposable {
    public abstract getGuiCommands(): CommandQuickPickItem[];
    public abstract dispose(): void;
}
