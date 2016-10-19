import { readdir, stat } from 'fs';
import { join } from 'path';

const filewalker = require('filewalker');

type WorkspaceFile = { path: string, isDirectory: boolean };

export function getFiles(directory): Promise<string[]> {
    return new Promise((resolve, reject) => {
        let files = [];
        filewalker(directory, { matchRegExp: /(\.d)?\.tsx?$/ })
            .on('error', err => {
                console.error(`Error happened during loading files from path: ${err}`);
                reject(err);
            })
            .on('file', file => {
                files.push(join(directory, file));
            })
            .on('done', () => {
                resolve(files);
            })
            .walk();
    });
}
