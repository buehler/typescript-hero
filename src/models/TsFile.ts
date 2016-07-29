import path = require('path');

export class TsFile {
    private path: path.ParsedPath;

    constructor(fileName: string) {
        this.path = path.parse(fileName);
    }
}
