import path = require('path');

export class TsFile {
    private _path: path.ParsedPath;

    public get path(): path.ParsedPath {
        return this._path;
    }

    public get fsPath(): string {
        return path.format(this._path);
    }

    constructor(fileName: string) {
        this._path = path.parse(fileName);
        if (this._path.name.endsWith('.d')) {
            this._path.name = this._path.name.replace('.d', '');
            this._path.ext = '.d.ts';
        }
    }
}
