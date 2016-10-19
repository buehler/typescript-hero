import { ExtensionConfig } from '../../src/ExtensionConfig';
import { TsResourceParser } from '../../src/parser/TsResourceParser';
import { LoggerFactory } from '../../src/utilities/Logger';
import { inject, injectable } from 'inversify';
import { getFiles } from '../utilities';
import { CancellationToken, Uri, workspace } from 'vscode';
import { ResolveIndex } from '../../src/caches/ResolveIndex';

@injectable()
export class LocalWorkspaceResolveIndexMock extends ResolveIndex {
    private mockPath: string;
    private myConfig: ExtensionConfig;

    constructor( @inject('LoggerFactory') loggerFactory: LoggerFactory, parser: TsResourceParser, config: ExtensionConfig) {
        super(loggerFactory, parser, config);
        this.myConfig = config;
        this.mockPath = process.env.CODE_TESTS_WORKSPACE || workspace.rootPath;
        console.log(`use mocked findFiles() with path: ${this.mockPath}`);
    }

    protected async findFiles(cancellationToken: CancellationToken): Promise<Uri[]> {
        let files = await getFiles(this.mockPath),
            excludePatterns = this.myConfig.resolver.ignorePatterns;
        return files
            .filter(f => f.split(/\\|\//).every(p => excludePatterns.indexOf(p) < 0))
            .map(f => <Uri>{ fsPath: f });
    }
}
