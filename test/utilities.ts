import { join } from 'path';
import { readdir, stat } from 'fs';
import { workspace } from 'vscode';

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

// export async function openTestfiles(): Promise<void> {
//     for (let file of await getFiles(workspace.rootPath)) {
//         await workspace.openTextDocument(file);
//     }
// }

// export async function waitForWorkspace(): Promise<void> {
//     if (workspace.textDocuments.length > 0) {
//         return;
//     }
//     let interval;
//     await openTestfiles();
//     return new Promise<void>(resolve => {
//         let fn = () => {
//             if (workspace.textDocuments.length > 0) {
//                 clearInterval(interval);
//                 resolve();
//             }
//         };

//         interval = setInterval(() => fn(), 10);
//     });
// }
