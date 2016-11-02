import { InputBoxOptions } from 'vscode';

/**
 * Typescript hero internal command that is executed from the guiprovider.
 * 
 * @export
 * @class TshCommand
 */
export class TshCommand {
    constructor(public action: (...args: any[]) => void, public args?: InputBoxOptions[]) { }
}
