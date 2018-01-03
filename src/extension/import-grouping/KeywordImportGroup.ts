import { Import, StringImport } from 'typescript-parser';

import { ConfigFactory } from '../../common/factories/index';
import { IocDecorators } from '../IoC';
import { iocSymbols } from '../IoCSymbols';
import { importSort } from '../utilities/utilityFunctions';
import { ImportGroup } from './ImportGroup';
import { ImportGroupKeyword } from './ImportGroupKeyword';
import { ImportGroupOrder } from './ImportGroupOrder';

/**
 * Importgroup for keywords. Uses "Modules", "Plains", "Workspace" as a keyword and processes the corresponding imports.
 *
 * @export
 * @class KeywordImportGroup
 * @implements {ImportGroup}
 */
export class KeywordImportGroup implements ImportGroup {
    public readonly imports: Import[] = [];

    @IocDecorators.lazyInject(iocSymbols.configuration)
    private config: ConfigFactory;

    public get sortedImports(): Import[] {
        return this.imports.sort((i1, i2) => importSort(i1, i2, this.order));
    }

    constructor(public readonly keyword: ImportGroupKeyword, public readonly order: ImportGroupOrder = 'asc') { }

    public reset(): void {
        this.imports.length = 0;
    }

    public processImport(tsImport: Import): boolean {
        console.log('processing, got IoC config', this.config(null));
        switch (this.keyword) {
            case ImportGroupKeyword.Modules:
                return this.processModulesImport(tsImport);
            case ImportGroupKeyword.Plains:
                return this.processPlainsImport(tsImport);
            case ImportGroupKeyword.Workspace:
                return this.processWorkspaceImport(tsImport);
            default:
                return false;
        }
    }

    /**
     * Process a library import.
     * @example import ... from 'vscode';
     *
     * @private
     * @param {Import} tsImport
     * @returns {boolean}
     *
     * @memberof KeywordImportGroup
     */
    private processModulesImport(tsImport: Import): boolean {
        if (
            tsImport instanceof StringImport ||
            tsImport.libraryName.startsWith('.') ||
            tsImport.libraryName.startsWith('/')
        ) {
            return false;
        }
        this.imports.push(tsImport);
        return true;
    }

    /**
     * Process a string only import.
     * @example import 'reflect-metadata';
     *
     * @private
     * @param {Import} tsImport
     * @returns {boolean}
     *
     * @memberof KeywordImportGroup
     */
    private processPlainsImport(tsImport: Import): boolean {
        if (!(tsImport instanceof StringImport)) {
            return false;
        }
        this.imports.push(tsImport);
        return true;
    }

    /**
     * Process a workspace import (not string nor lib import).
     * @example import ... from './server';
     *
     * @private
     * @param {Import} tsImport
     * @returns {boolean}
     *
     * @memberof KeywordImportGroup
     */
    private processWorkspaceImport(tsImport: Import): boolean {
        if (
            tsImport instanceof StringImport ||
            (
                !tsImport.libraryName.startsWith('.') &&
                !tsImport.libraryName.startsWith('/')
            )
        ) {
            return false;
        }
        this.imports.push(tsImport);
        return true;
    }
}
