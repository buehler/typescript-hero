import { Generatable } from '../../common/ts-generation';
import { Import } from '../../common/ts-parsing/imports';
import { ImportGroupOrder } from './ImportGroupOrder';

/**
 * TODO
 * 
 * @export
 * @interface ImportGroup
 * @extends {Generatable}
 */
export interface ImportGroup extends Generatable {
    readonly imports: Import[];
    order: ImportGroupOrder;
    processImport(tsImport: Import): boolean;
}
