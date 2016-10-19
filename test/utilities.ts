import { readdir, stat } from 'fs';
import { join } from 'path';

type WorkspaceFile = { path: string, isDirectory: boolean };

async function walk(directory): Promise<WorkspaceFile[]> {
    return new Promise<WorkspaceFile[]>((resolve, reject) => {
        readdir(directory, (err, files) => {
            if (err) {
                reject(err);
                return;
            }
            Promise
                .all(files.map(file => {
                    let path = join(directory, file);
                    return new Promise<WorkspaceFile>((resolve, reject) => {
                        stat(path, (err, stats) => {
                            if (err) {
                                reject(err);
                                return;
                            }
                            resolve({
                                path,
                                isDirectory: stats.isDirectory()
                            });
                        });
                    });
                }))
                .then(resolve)
                .catch(reject);
        });
    });
}

export async function getFiles(directory): Promise<string[]> {
    let files: WorkspaceFile[] = [];

    for (let file of await walk(directory)) {
        if (file.isDirectory) {
            files = files.concat(await walk(file.path));
        } else {
            files.push(file);
        }
    }

    return files.filter(f => !f.isDirectory).map(f => f.path);
}
