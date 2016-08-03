import {TsResolveFile} from '../models/TsResolveFile';
import {ResolveItem} from '../models/ResolveItem';
import * as inversify from 'inversify';
import {TsDeclaration, TsExportableDeclaration, TsModuleDeclaration} from '../models/TsDeclaration';
import {TsExport, TsFromExport, TsAssignedExport, TsAllFromExport, TsNamedFromExport} from '../models/TsExport';
import path = require('path');
import vscode = require('vscode');

type LibExports = { [libName: string]: { declarations: ResolveItem[], exports: TsExport[] } };

function isExportable(declaration: TsDeclaration): declaration is TsExportableDeclaration {
    return declaration instanceof TsExportableDeclaration;
}

function isModule(declaration: TsDeclaration): declaration is TsModuleDeclaration {
    return declaration instanceof TsModuleDeclaration;
}

@inversify.injectable()
export class ResolveItemFactory {
    public getResolvableItems(files: TsResolveFile[], relativeDocument: vscode.Uri): ResolveItem[] {
        let libExports: LibExports = {},
        relativePath = path.parse(relativeDocument.fsPath);

        // process all the files        
        for (let file of files.filter(o => !!o.declarations.length || !!o.exports.length)) {
            if (!file.isDeclarationFile) {
                this.processLocalFile(libExports, file, relativePath);
            } else {
                if (file.declarations.some(o => isModule(o))) {
                    this.processTypingsFile(libExports, file);
                } else {
                    this.processNodeFile(libExports, file);
                }
            }
        }

        // calculate all export statements (shovel around declarations.)
        Object
            .keys(libExports)
            .sort((k1, k2) => k2.length - k1.length)
            .forEach(key => {
                let lib = libExports[key];
                for (let ex of lib.exports) {
                    if (ex instanceof TsFromExport) {
                        if (!libExports[key] || !ex.from) {
                            continue;
                        }
                        let fromLib = path.resolve(key, ex.from);
                        fromLib = fromLib.substring(fromLib.indexOf(key));
                        if (!libExports[fromLib]) {
                            continue;
                        }
                        if (ex instanceof TsAllFromExport) {
                            libExports[fromLib].declarations.forEach(o => o.libraryName = key);
                            libExports[key].declarations.push(...libExports[fromLib].declarations);
                            libExports[fromLib].declarations = [];
                        }
                        // ts export from (named)
                    }
                }
            });

        return Object.keys(libExports).reduce((all, key) => all.concat(libExports[key].declarations), []);
    }

    private processLocalFile(libExports: LibExports, file: TsResolveFile, relativeDocument: path.ParsedPath): void {
        let libname = path.relative(relativeDocument.dir, path.format(file.path)).replace('.ts', '');
        if (!libname.startsWith('.')) {
            libname = './';
        }

        if (!libExports[libname]) {
            libExports[libname] = { declarations: [], exports: [] };
        }
        libExports[libname].exports.push(...file.exports);
        for (let declaration of file.declarations) {
            if (isExportable(declaration) && declaration.isExported) {
                libExports[libname].declarations.push(new ResolveItem(declaration, libname, file));
            }
        }
    }

    private processNodeFile(libExports: LibExports, file: TsResolveFile): void {
        let dirSplit = file.path.dir.split('/');
        let nodeIndex = dirSplit.indexOf('node_modules');
        let libname = `${dirSplit.slice(nodeIndex + 1).join('/')}/${file.path.name}`.replace('/index', '');

        if (!libExports[libname]) {
            libExports[libname] = { declarations: [], exports: [] };
        }

        libExports[libname].declarations.push(...file.declarations.filter(o => isExportable(o) && o.isExported).map(o => new ResolveItem(o, libname, file)));
        libExports[libname].exports.push(...file.exports);
    }

    private processTypingsFile(libExports: LibExports, file: TsResolveFile): void {
        for (let mod of file.declarations) {
            if (isModule(mod)) {
                for (let declaration of mod.declarations) {
                    if (isExportable(declaration) && declaration.isExported) {
                        if (!libExports[mod.name]) {
                            libExports[mod.name] = { declarations: [], exports: [] };
                        }
                        if (!libExports[mod.name].declarations.some(o => o.declaration.name === declaration.name)) {
                            libExports[mod.name].declarations.push(new ResolveItem(declaration, mod.name, file));
                        }
                    }
                }

                for (let ex of mod.exports) {
                    if (!libExports[mod.name]) {
                        libExports[mod.name] = { declarations: [], exports: [] };
                    }
                    if (ex instanceof TsAssignedExport) {
                        for (let declaration of ex.declarations) {
                            if (isExportable(declaration) && declaration.isExported && !libExports[mod.name].declarations.some(o => o.declaration.name === declaration.name)) {
                                libExports[mod.name].declarations.push(new ResolveItem(declaration, mod.name, file));
                            }
                        }
                    } else if (ex instanceof TsNamedFromExport) {
                        ex.specifiers.forEach(o => {
                            if (!libExports[mod.name].declarations.some(d => d.declaration.name === o.specifier)) {
                                libExports[mod.name].declarations.push(new ResolveItem(mod.declarations.find(d => d.name === o.specifier), mod.name, file, o.alias));
                            }
                        });
                    }
                }
            }
        }
    }
}
