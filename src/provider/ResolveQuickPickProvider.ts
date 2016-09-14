import {DeclarationInfo, ResolveIndex} from '../caches/ResolveIndex';
import {ResolveQuickPickItem} from '../models/QuickPickItems';
import {DefaultDeclaration} from '../models/TsDeclaration';
import {TsDefaultImport, TsExternalModuleImport, TsImport, TsNamedImport, TsNamespaceImport} from '../models/TsImport';
import {TsResourceParser} from '../parser/TsResourceParser';
import {Logger, LoggerFactory} from '../utilities/Logger';
import {inject, injectable} from 'inversify';
import {join, normalize, parse} from 'path';
import {TextEditor, window, workspace} from 'vscode';

@injectable()
export class ResolveQuickPickProvider {
    private logger: Logger;

    constructor( @inject('LoggerFactory') loggerFactory: LoggerFactory, private resolveIndex: ResolveIndex, private parser: TsResourceParser) {
        this.logger = loggerFactory('ResolveQuickPickProvider');
    }

    public addImportPick(activeDocument: TextEditor): Thenable<ResolveQuickPickItem> {
        return window.showQuickPick(this.buildQuickPickList(activeDocument));
    }

    public addImportUnderCursorPick(activeDocument: TextEditor, cursorSymbol: string): Thenable<ResolveQuickPickItem> {
        return this.buildQuickPickList(activeDocument, cursorSymbol)
            .then(resolveItems => {
                if (resolveItems.length < 1) {
                    window.showInformationMessage(`The symbol '${cursorSymbol}' was not found in the index or is already imported.`);
                    return;
                } else if (resolveItems.length === 1 && resolveItems[0].label === cursorSymbol) {
                    return resolveItems[0];
                } else {
                    return window.showQuickPick(resolveItems, { placeHolder: 'Multiple declarations found:' });
                }
            });
    }

    private buildQuickPickList(activeDocument: TextEditor, cursorSymbol?: string): Promise<ResolveQuickPickItem[]> {
        return this.parser.parseSource(activeDocument.document.getText())
            .then(parsedSource => {
                let declarations = this.prepareDeclarations(activeDocument.document.fileName, parsedSource.imports);
                if (cursorSymbol) {
                    declarations = declarations.filter(o => o.declaration.name.startsWith(cursorSymbol));
                }
                let activeDocumentDeclarations = parsedSource.declarations.map(o => o.name);
                declarations = [
                    ...declarations.filter(o => o.from.startsWith('/')),
                    ...declarations.filter(o => !o.from.startsWith('/'))
                ];
                return declarations.filter(o => activeDocumentDeclarations.indexOf(o.declaration.name) === -1).map(o => new ResolveQuickPickItem(o));
            });
    }

    private prepareDeclarations(documentPath: string, imports: TsImport[]): DeclarationInfo[] {
        let declarations = Object
            .keys(this.resolveIndex.index)
            .sort()
            .reduce((all, key) => {
                for (let declaration of this.resolveIndex.index[key]) {
                    all.push({
                        declaration: declaration.declaration,
                        from: declaration.from,
                        key: key
                    });
                }
                return all;
            }, []);

        for (let tsImport of imports) {
            if (tsImport instanceof TsNamedImport) {
                let importedLib = tsImport.libraryName;
                if (importedLib.startsWith('.')) {
                    let parsed = parse(documentPath);
                    importedLib = '/' + workspace.asRelativePath(normalize(join(parsed.dir, importedLib)));
                }
                declarations = declarations.filter(o => o.from.replace(/[/]?index$/, '') !== importedLib || !tsImport.specifiers.some(s => s.specifier === o.key));
            } else if (tsImport instanceof TsNamespaceImport || tsImport instanceof TsExternalModuleImport) {
                declarations = declarations.filter(o => o.from !== tsImport.libraryName);
            } else if (tsImport instanceof TsDefaultImport) {
                declarations = declarations.filter(o => (!(o.declaration instanceof DefaultDeclaration) || tsImport.libraryName !== o.from.replace(/[/]?index$/, '')));
            }
        }

        return declarations;
    }
}
