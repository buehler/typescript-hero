import {DeclarationInfo, ResolveIndex} from '../caches/ResolveIndex';
import {DefaultDeclaration} from '../models/TsDeclaration';
import {TsDefaultImport, TsExternalModuleImport, TsImport, TsNamedImport, TsNamespaceImport} from '../models/TsImport';
import {join, normalize, parse, relative} from 'path';
import {workspace} from 'vscode';

export function getDeclarationsFilteredByImports(resolveIndex: ResolveIndex, documentPath: string, imports: TsImport[]): DeclarationInfo[] {
    let declarations = resolveIndex.declarationInfos;

    for (let tsImport of imports) {
        if (tsImport instanceof TsNamedImport) {
            let importedLib = getRelativeLibraryName(tsImport.libraryName, documentPath);
            declarations = declarations.filter(o => o.from !== importedLib || !tsImport.specifiers.some(s => s.specifier === o.declaration.name));
        } else if (tsImport instanceof TsNamespaceImport || tsImport instanceof TsExternalModuleImport) {
            declarations = declarations.filter(o => o.from !== tsImport.libraryName);
        } else if (tsImport instanceof TsDefaultImport) {
            declarations = declarations.filter(o => (!(o.declaration instanceof DefaultDeclaration) || tsImport.libraryName !== o.from));
        }
    }

    return declarations;
}

export function getRelativeLibraryName(library: string, actualFilePath: string): string {
    if (!library.startsWith('.')) {
        return library;
    }
    return '/' + workspace.asRelativePath(normalize(join(parse(actualFilePath).dir, library)));
}

export function getRelativeImportPath(library: string, actualFilePath: string): string {
    if (!library.startsWith('/')) {
        return library;
    }
    let actualDir = parse('/' + workspace.asRelativePath(actualFilePath)).dir,
        relativePath = relative(actualDir, library);
    if (!relativePath.startsWith('.')) {
        relativePath = './' + relativePath;
    } else if (relativePath === '..') {
        relativePath += '/';
    }
    relativePath = relativePath.replace(/\\/g, '/');
    return relativePath;
}
