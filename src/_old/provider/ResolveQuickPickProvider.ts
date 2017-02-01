import { ResolveIndex } from '../caches/ResolveIndex';
import { ResolveQuickPickItem } from '../models/QuickPickItems';
import { TsResourceParser } from '../parser/TsResourceParser';
import { Logger, LoggerFactory } from '../utilities/Logger';
import { getDeclarationsFilteredByImports } from '../utilities/ResolveIndexExtensions';
import { inject, injectable } from 'inversify';
import { TextDocument, window } from 'vscode';

/**
 * Provider instance that provides quickpick items for symbol resolving.
 * Asks the user for a choice of a symbol to be imported.
 * 
 * @export
 * @class ResolveQuickPickProvider
 */
@injectable()
export class ResolveQuickPickProvider {
    private logger: Logger;

    constructor(
        @inject('LoggerFactory') loggerFactory: LoggerFactory,
        private resolveIndex: ResolveIndex,
        private parser: TsResourceParser
    ) {
        this.logger = loggerFactory('ResolveQuickPickProvider');
    }

    /**
     * Returns a ResolveQuickPickItem (or null) for the active document.
     * If the user hits "esc" or cancels the quick pick in any way, NULL is returned.
     * Otherwise the selected ResolveQuickPickItem is returned.
     * 
     * @param {TextDocument} activeDocument
     * @returns {Promise<ResolveQuickPickItem>}
     * 
     * @memberOf ResolveQuickPickProvider
     */
    public async addImportPick(activeDocument: TextDocument): Promise<ResolveQuickPickItem> {
        let items = await this.buildQuickPickList(activeDocument);
        return window.showQuickPick<ResolveQuickPickItem>(items);
    }

    /**
     * Returns a ResolveQuickPickItem (or null) for the active document with taken the actual string symbol
     * under the cursor as a base filter. Has a slightly different behaviour based on items found:
     * - If no items are found, an information is shown to the user and the method resolves to undefined.
     * - If only one item is found and it matches the cursor string to 100%, it's resolved.
     * - If one item is found that only partial matches or multiple matches are found, a quickpick is shown.
     * 
     * @param {TextDocument} activeDocument
     * @param {string} cursorSymbol
     * @returns {Promise<ResolveQuickPickItem>}
     * 
     * @memberOf ResolveQuickPickProvider
     */
    public async addImportUnderCursorPick(
        activeDocument: TextDocument,
        cursorSymbol: string
    ): Promise<ResolveQuickPickItem> {
        let resolveItems = await this.buildQuickPickList(activeDocument, cursorSymbol);

        if (resolveItems.length < 1) {
            window.showInformationMessage(
                `The symbol '${cursorSymbol}' was not found in the index or is already imported.`
            );
            return;
        } else if (resolveItems.length === 1 && resolveItems[0].label === cursorSymbol) {
            return resolveItems[0];
        } else {
            return window.showQuickPick(resolveItems, { placeHolder: 'Multiple declarations found:' });
        }
    }

    /**
     * Internal method that builds the list of quickpick items that is shown to the user.
     * 
     * @private
     * @param {TextDocument} activeDocument
     * @param {string} [cursorSymbol]
     * @returns {Promise<ResolveQuickPickItem[]>}
     * 
     * @memberOf ResolveQuickPickProvider
     */
    private async buildQuickPickList(
        activeDocument: TextDocument,
        cursorSymbol?: string
    ): Promise<ResolveQuickPickItem[]> {
        let parsedSource = await this.parser.parseSource(activeDocument.getText()),
            declarations = getDeclarationsFilteredByImports(
                this.resolveIndex, activeDocument.fileName, parsedSource.imports
            );

        if (cursorSymbol) {
            declarations = declarations.filter(o => o.declaration.name.startsWith(cursorSymbol));
        }

        let activeDocumentDeclarations = parsedSource.declarations.map(o => o.name);

        declarations = [
            ...declarations.filter(o => o.from.startsWith('/')),
            ...declarations.filter(o => !o.from.startsWith('/'))
        ];

        return declarations
            .filter(o => activeDocumentDeclarations.indexOf(o.declaration.name) === -1)
            .map(o => new ResolveQuickPickItem(o));
    }
}
