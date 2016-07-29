import path = require('path');

export class TsFile {
    protected path: path.ParsedPath;

    constructor(fileName: string) {
        this.path = path.parse(fileName);
        if (this.path.name.endsWith('.d')) {
            this.path.name = this.path.name.replace('.d', '');
            this.path.ext = '.d.ts';
        }
    }
}
