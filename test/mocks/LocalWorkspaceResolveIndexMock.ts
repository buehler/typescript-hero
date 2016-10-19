import { ExtensionConfig } from '../../src/ExtensionConfig';
import { TsResourceParser } from '../../src/parser/TsResourceParser';
import { LoggerFactory } from '../../src/utilities/Logger';
import { inject, injectable } from 'inversify';
import { getFiles } from '../utilities';
import { CancellationToken, Uri, workspace } from 'vscode';
import { ResolveIndex } from '../../src/caches/ResolveIndex';

async function findFiles(cancellationToken: CancellationToken): Promise<Uri[]> {
    let path = process.env.CODE_TESTS_WORKSPACE || workspace.rootPath;
    console.log(`use mocked findFiles() with path: ${path}`);
    let files = await getFiles(path);
    return files.map(f => <Uri>{ fsPath: f });
}

@injectable()
export class LocalWorkspaceResolveIndexMock extends ResolveIndex {
    constructor( @inject('LoggerFactory') loggerFactory: LoggerFactory, parser: TsResourceParser, config: ExtensionConfig) {
        super(loggerFactory, parser, config);
        console.log('INSTANCE!!');
    }
}

(LocalWorkspaceResolveIndexMock as any).findFiles = findFiles;
