import {ImportSymbol} from '../models/ImportSymbol';
import {SymbolCache} from './SymbolCache';
import * as vscode from 'vscode';

class ImportList {
    
}

export class ImportManager {
    constructor(private cache: SymbolCache) { }

    public organizeImports(item?: ImportSymbol): void {
        vscode.window.activeTextEditor.
    }

    public addImport(item: ImportSymbol): void {
        this.organizeImports(item);
    }
}


// const filteredExports = filterExports(exports, nonTypedEntry);
//     vscode.window.activeTextEditor.edit((builder) => {
//         const lineCount = vscode.window.activeTextEditor.document.lineCount;
//         // search for import-lines we can replace instead of adding another bunch of the same lines
//         for (let i = 0; i < lineCount; i++) {
//             const line = vscode.window.activeTextEditor.document.lineAt(i);
//             const matches = line.text.match(matchers.imports);
//             if (matches) {
//                 const _export = containsLibraryName(filteredExports, matches[2]) || containsSanitizedPath(filteredExports, matches[2]);
//                 if (_export !== null) {
//                     const range = new vscode.Range(new vscode.Position(i, 0), new vscode.Position(i + 1, 0));
//                     builder.replace(range, createImportLine(_export));
//                     // remove the updated import line from the list ...
//                     filteredExports.splice(filteredExports.indexOf(_export), 1);
//                     // ... and search for seperate libraryNames with the same exports and remove them (ex. angular has deprecated doubles)
//                     const exportedNameList = matches[1].split(',').map(item => item.trim());
//                     exportedNameList.forEach((name) => {
//                         const _export = containsExportedName(filteredExports, name)
//                         if (_export) filteredExports.splice(filteredExports.indexOf(_export), 1);
//                     });
//                 }
//             }
//         }
//         // all filtered exportes left are added as new imports
//         for (let i = 0; i < filteredExports.length; i++) {
//             builder.replace(new vscode.Position(0, 0), createImportLine(filteredExports[i]));
//         }
//     });