import { DeclarationIndexPartial } from '../../common/transport-models';
import { Notification } from '../../common/communication';
import { DeclarationInfoIndex } from '../../common/indices';
import { DeclarationInfo } from '../../common/ts-parsing/declarations';
import { Logger, LoggerFactory } from '../../common/utilities';
import { iocSymbols } from '../IoCSymbols';
import { ClientConnection } from '../utilities/ClientConnection';
import { inject, injectable } from 'inversify';

/*
basic idea: keep the index in the extension and only do the parsing on the server side (for performance)
-> incremental stuff (aka file events) are async event bound
-> initial load: parses and sends the declarations (by 250 parts per notification)
-> when done: send OK msg.
*/

/**
 * Global index of typescript declarations. Contains declarations and origins.
 * Provides reverse index for search and declaration info for imports.
 * 
 * @export
 * @class DeclarationIndex
 */
@injectable()
export class CalculatedDeclarationIndex {
    private logger: Logger;
    private tempIndex: DeclarationInfoIndex | undefined;

    /**
     * Declaration index. Reverse index from a name to many declarations assotiated to the name.
     * 
     * @private
     * @type {(DeclarationInfoIndex | undefined)}
     * @memberof DeclarationIndex
     */
    private _index: DeclarationInfoIndex | undefined;

    /**
     * Indicator if the first index was loaded and calculated or not.
     * 
     * @readonly
     * @type {boolean}
     * @memberof DeclarationIndex
     */
    public get indexReady(): boolean {
        return this._index !== undefined;
    }

    /**
     * Reverse index of the declarations.
     * 
     * @readonly
     * @type {(DeclarationInfoIndex | undefined)}
     * @memberof DeclarationIndex
     */
    public get index(): DeclarationInfoIndex | undefined {
        return this._index;
    }

    /**
     * List of all declaration information. Contains the typescript declaration and the
     * "from" information (from where the symbol is imported). 
     * 
     * @readonly
     * @type {DeclarationInfo[]}
     * @memberof DeclarationIndex
     */
    public get declarationInfos(): DeclarationInfo[] {
        return Object
            .keys(this.index)
            .sort()
            .reduce((all, key) => all.concat(this.index![key]), <DeclarationInfo[]>[]);
    }

    constructor(
        @inject(iocSymbols.loggerFactory) loggerFactory: LoggerFactory,
        private connection: ClientConnection,
    ) {
        this.logger = loggerFactory('DeclarationIndex');
        this.logger.info('Instantiated.');
        this.connection.onSerializedNotification(
            Notification.PartialIndexResult,
            ([partials]: [DeclarationIndexPartial[]]) => {
                if (!this.tempIndex) {
                    this.tempIndex = {};
                    this.logger.info('Receiving partial index result.');
                }
                for (const partial of partials) {
                    this.tempIndex[partial.index] = partial.infos;
                }
            },
        );
        this.connection.onNotification(Notification.IndexCreationSuccessful, () => {
            if (!this.tempIndex) {
                return;
            }
            this._index = this.tempIndex;
            delete this.tempIndex;
            this.logger.info('Index completely received, cleaning up temp index.');
        });
        this.connection.onNotification(Notification.IndexCreationFailed, () => {
            this.logger.error('Index creation failed, cleanup temp index.');
            delete this.tempIndex;
        });
    }
}
