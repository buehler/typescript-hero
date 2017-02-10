import { TypescriptParser } from '../../common/ts-parsing';
import { DeclarationInfoIndex } from '../../common/indices';
import { DeclarationInfo } from '../../common/ts-parsing/declarations';
import { Resource } from '../../common/ts-parsing/resources';
import { Logger, LoggerFactory } from '../../common/utilities';
import { iocSymbols } from '../IoCSymbols';
import { inject, injectable } from 'inversify';

/**
 * Helper type to index all possible resources of the current workspace.
 */
type Resources = { [name: string]: Resource };

// TODO: build index "cache": store "orders" to build for certain files and stuff to a cache if
// a build is already running.

/**
 * Global index of typescript declarations. Contains declarations and origins.
 * Provides reverse index for search and declaration info for imports.
 * 
 * @export
 * @class DeclarationIndex
 */
@injectable()
export class DeclarationIndex {
    private logger: Logger;

    /**
     * Hash of parsed resources. Contains all parsed files / namespaces / declarations
     * of the current workspace.
     *
     * @private
     * @type {(Resources | undefined)}
     * @memberOf DeclarationIndex
     */
    private parsedResources: Resources | undefined = Object.create(null);

    /**
     * Declaration index. Reverse index from a name to many declarations assotiated to the name.
     * 
     * @private
     * @type {(DeclarationInfoIndex | undefined)}
     * @memberOf DeclarationIndex
     */
    private _index: DeclarationInfoIndex | undefined;

    /**
     * Indicator if the first index was loaded and calculated or not.
     * 
     * @readonly
     * @type {boolean}
     * @memberOf DeclarationIndex
     */
    public get indexReady(): boolean {
        return this._index !== undefined;
    }

    /**
     * Reverse index of the declarations.
     * 
     * @readonly
     * @type {DeclarationInfoIndex}
     * @memberOf DeclarationIndex
     */
    public get index(): DeclarationInfoIndex {
        return this._index;
    }

    /**
     * List of all declaration information. Contains the typescript declaration and the
     * "from" information (from where the symbol is imported). 
     * 
     * @readonly
     * @type {DeclarationInfo[]}
     * @memberOf ResolveIndex
     */
    public get declarationInfos(): DeclarationInfo[] {
        return Object
            .keys(this.index)
            .sort()
            .reduce((all, key) => all.concat(this.index[key]), <DeclarationInfo[]>[]);
    }

    constructor(
        @inject(iocSymbols.loggerFactory) loggerFactory: LoggerFactory,
        private parser: TypescriptParser
    ) {
        this.logger = loggerFactory('DeclarationIndex');
        this.logger.info('Instantiated.');
    }

    /**
     * Resets the whole index. Does delete everything. Period.
     * Is useful for unit testing or similar things.
     * 
     * @memberOf DeclarationIndex
     */
    public reset(): void {
        this.parsedResources = undefined;
        this._index = undefined;
        this.logger.info('Reset called, deleted index.');
    }
}
