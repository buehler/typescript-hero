import { File } from 'typescript-parser';
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
    readonly parsedDocument: File;

    /**
     * Commits the changes made to the given document.
     * 
     * @returns {Promise<boolean>}
     *
     * @memberof ObjectManager
     */
    commit(): Promise<boolean>;
}
