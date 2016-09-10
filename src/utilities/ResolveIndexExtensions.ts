import {DeclarationInfo, ResolveIndex} from '../caches/ResolveIndex';
import {DefaultDeclaration} from '../models/TsDeclaration';
import {TsDefaultImport, TsExternalModuleImport, TsImport, TsNamedImport, TsNamespaceImport} from '../models/TsImport';
import {join, normalize, parse} from 'path';
import {workspace} from 'vscode';

export function getDeclarationsFilteredByImports(resolveIndex: ResolveIndex, documentPath: string, imports: TsImport[]): DeclarationInfo[] {
    let declarations = Object
            .keys(resolveIndex.index)
            .sort()
            .reduce((all, key) => {
                for (let declaration of resolveIndex.index[key]) {
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
