import { ExtensionConfig } from '../../src/ExtensionConfig';
import { TsResourceParser } from '../../src/parser/TsResourceParser';
import { LoggerFactory } from '../../src/utilities/Logger';
import { inject, injectable } from 'inversify';
import { getFiles } from '../utilities';
import { CancellationToken, Uri, workspace } from 'vscode';
import { ResolveIndex } from '../../src/caches/ResolveIndex';

async function findFiles(cancellationToken: CancellationToken): Promise<Uri[]> {
    let files = await getFiles(workspace.rootPath);
    return files.map(f => <Uri>{ fsPath: f });
}

@injectable()
export class LocalWorkspaceResolveIndexMock extends ResolveIndex {
    constructor( @inject('LoggerFactory') loggerFactory: LoggerFactory, parser: TsResourceParser, config: ExtensionConfig) {
        super(loggerFactory, parser, config);
    }
}

(LocalWorkspaceResolveIndexMock as any).findFiles = findFiles;
