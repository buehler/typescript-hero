import { TsFile } from '../models/TsResource';
import { TextDocument } from 'vscode';

/**
 * Base interface for all object managers. Those managers can modify a class / imports / and any other
 * coded objects. On calling commit(), the changes must be commited to the provided document.
 * 
 * @export
 * @interface ObjectManager
 */
export interface ObjectManager {
    readonly document: TextDocument;
    readonly parsedDocument: TsFile;

    /**
     * Commits the changes made to the given document.
     * 
     * @returns {Promise<boolean>}
     * 
     * @memberOf ObjectManager
     */
    commit(): Promise<boolean>;
}
