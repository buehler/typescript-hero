import { Uri, workspace, WorkspaceConfiguration } from 'vscode';

import { CodeOutlineConfig } from '../../common/config';

const sectionKey = 'typescriptHero.codeOutline';

/**
 * Configuration interface for the code outline feature.
 *
 * @class VscodeCodeOutlineConfig
 * @implements {CodeOutlineConfig}
 */
export class VscodeCodeOutlineConfig implements CodeOutlineConfig {
    private get workspaceSection(): WorkspaceConfiguration {
        return workspace.getConfiguration(sectionKey, this.resource);
    }

    /**
     * Defined if the code outline feature is enabled or not.
     *
     * @readonly
     * @type {boolean}
     * @memberof VscodeCodeOutlineConfig
     */
    public get outlineEnabled(): boolean {
        return this.workspaceSection.get('enabled', true);
    }

    constructor(public readonly resource?: Uri) { }
}
