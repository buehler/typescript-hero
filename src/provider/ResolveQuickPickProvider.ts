import {DeclarationInfo, ResolveIndex, ResourceIndex} from '../caches/ResolveIndex';
import {ResolveQuickPickItem} from '../models/QuickPickItems';
import {DefaultDeclaration} from '../models/TsDeclaration';
import {TsDefaultImport, TsExternalModuleImport, TsImport, TsNamedImport, TsNamespaceImport} from '../models/TsImport';
import {TsResourceParser} from '../parser/TsResourceParser';
import {Logger, LoggerFactory} from '../utilities/Logger';
import {inject, injectable} from 'inversify';
import {join, normalize, parse, resolve} from 'path';
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

    public addImportFromCursorPick(): void {

    }

    public buildQuickPickList(activeDocument: TextEditor, cursorSymbol?: string): Thenable<ResolveQuickPickItem[]> {
        return this.parser.parseSource(activeDocument.document.getText())
            .then(parsedSource => {
                let declarations = this.prepareDeclarations(activeDocument.document.fileName, parsedSource.imports);
                return declarations.map(o => new ResolveQuickPickItem(o));
            })
            .catch(error => {
                this.logger.error('Error during quick list building.', { error });
                return [];
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
                    importedLib = workspace.asRelativePath(normalize(join(parsed.dir, importedLib)));
                }
                declarations = declarations.filter(o => o.from !== importedLib || !tsImport.specifiers.some(s => s.specifier === o.key));
            } else if (tsImport instanceof TsNamespaceImport || tsImport instanceof TsExternalModuleImport) {
                declarations = declarations.filter(o => o.from !== tsImport.libraryName);
            } else if (tsImport instanceof TsDefaultImport) {
                declarations = declarations.filter(o => (!(o.declaration instanceof DefaultDeclaration) || tsImport.libraryName !== o.libraryName));
            }
        }

        return declarations;
    }
}
