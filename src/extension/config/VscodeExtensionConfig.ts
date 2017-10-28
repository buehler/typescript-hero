import { injectable } from 'inversify';
import { Uri, workspace, WorkspaceConfiguration } from 'vscode';

import { CodeCompletionConfig, CodeOutlineConfig, ExtensionConfig, ResolverConfig } from '../../common/config';
import { VscodeCodeCompletionConfig } from './VscodeCodeCompletionConfig';
import { VscodeCodeOutlineConfig } from './VscodeCodeOutlineConfig';
import { VscodeResolverConfig } from './VscodeResolverConfig';

const sectionKey = 'typescriptHero';

/**
 * Configuration class for TypeScript Hero
 * Contains all exposed config endpoints.
 *
 * @export
 * @class VscodeExtensionConfig
 */
@injectable()
export class VscodeExtensionConfig implements ExtensionConfig {
    public readonly possibleLanguages: string[] = [
        'typescript',
        'typescriptreact',
        'javascript',
        'javascriptreact',
    ];

    private resolverConfig: ResolverConfig;
    private codeOutlineConfig: CodeOutlineConfig;
    private codeCompletionConfig: CodeCompletionConfig;

    private get workspaceSection(): WorkspaceConfiguration {
        return workspace.getConfiguration(sectionKey, this.resource);
    }

    /**
     * The actual log level.
     *
     * @readonly
     * @type {'error' | 'warn' | 'info' | 'debug'}
     * @memberof VscodeExtensionConfig
     */
    public get verbosity(): 'error' | 'warn' | 'info' | 'debug' {
        const verbosity = this.workspaceSection.get<'error' | 'warn' | 'info' | 'debug'>('verbosity', 'warn');
        if (['error', 'warn', 'info', 'debug'].indexOf(verbosity) < 0) {
            return 'warn';
        }
        return verbosity;
    }

    /**
     * Configuration object for the resolver extension.
     *
     * @readonly
     * @type {ResolverConfig}
     * @memberof VscodeExtensionConfig
     */
    public get resolver(): ResolverConfig {
        return this.resolverConfig;
    }

    /**
     * Configuration object for the code outline extension.
     *
     * @readonly
     * @type {CodeOutlineConfig}
     * @memberof VscodeExtensionConfig
     */
    public get codeOutline(): CodeOutlineConfig {
        return this.codeOutlineConfig;
    }

    /**
     * Configuration object for the code completion extension.
     *
     * @readonly
     * @type {CodeCompletionConfig}
     * @memberof VscodeExtensionConfig
     */
    public get codeCompletion(): CodeCompletionConfig {
        return this.codeCompletionConfig;
    }

    constructor(public readonly resource?: Uri) {
        this.codeCompletionConfig = new VscodeCodeCompletionConfig(resource);
        this.codeOutlineConfig = new VscodeCodeOutlineConfig(resource);
        this.resolverConfig = new VscodeResolverConfig(resource);
    }
}


