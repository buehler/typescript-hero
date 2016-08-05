import {InputBoxOptions} from 'vscode';

export class TshCommand {
    constructor(public action: (...args: any[]) => void, public args?: InputBoxOptions[]) { }
}
