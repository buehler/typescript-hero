import {Position, Range, TextDocument} from 'vscode';

export abstract class TsNode {
    constructor(public start?: number, public end?: number) { }

    public getRange(document: TextDocument): Range {
        return this.start !== undefined && this.end !== undefined ?
            new Range(document.positionAt(this.start), document.positionAt(this.end)) :
            new Range(new Position(0, 0), new Position(0, 0));
    }
}
