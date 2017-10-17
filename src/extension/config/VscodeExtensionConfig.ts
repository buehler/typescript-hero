import { injectable } from 'inversify';
import { Uri, workspace, WorkspaceConfiguration } from 'vscode';

import { CodeCompletionConfig, CodeOutlineConfig, ExtensionConfig, ResolverConfig } from '../../common/config';
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
    private resolverConfig: ResolverConfig = new VscodeResolverConfig();
    private codeOutlineConfig: CodeOutlineConfig = new VscodeCodeOutlineConfig();
    private codeCompletionConfig: CodeCompletionConfig = '' as any;

    private get workspaceSection(): WorkspaceConfiguration {
        return workspace.getConfiguration(sectionKey, this.resource);
    }

    /**
     * The actual log level.
     *
     * @readonly
     * @type {string}
     * @memberof VscodeExtensionConfig
     */
    public get verbosity(): string {
        return this.workspaceSection.get<string>('verbosity', 'Warning');
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

    constructor(public readonly resource?: Uri) { }
}


