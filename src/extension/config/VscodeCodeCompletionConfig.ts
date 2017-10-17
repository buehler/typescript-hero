import { Uri, workspace, WorkspaceConfiguration } from 'vscode';

import { CodeCompletionConfig } from '../../common/config';

const sectionKey = 'typescriptHero.codeCompletion';

/**
 * Configuration interface for the code outline feature.
 *
 * @class VscodeCodeCompletionConfig
 * @implements {CodeCompletionConfig}
 */
export class VscodeCodeCompletionConfig implements CodeCompletionConfig {
    private get workspaceSection(): WorkspaceConfiguration {
        return workspace.getConfiguration(sectionKey, this.resource);
    }

    /**
     * Defines the used completion sort mode (i.e. if the completions should be sorted to the bottom of the list).
     *
     * @readonly
     * @type {'default'|'bottom'}
     * @memberof VscodeCodeCompletionConfig
     */
    public get completionSortMode(): 'default' | 'bottom' {
        return this.workspaceSection.get<'default' | 'bottom'>('completionSortMode', 'default');
    }

    constructor(public readonly resource?: Uri) { }
}
