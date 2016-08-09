import {ResolveItem} from '../models/ResolveItem';
import {TsDeclaration, TsDefaultDeclaration, TsExportableDeclaration, TsModuleDeclaration} from '../models/TsDeclaration';
import {TsAllFromExport, TsAssignedExport, TsDefaultExport, TsExport, TsFromExport, TsNamedFromExport} from '../models/TsExport';
import {TsDefaultImport, TsExternalModuleImport, TsImport, TsNamedImport, TsNamespaceImport} from '../models/TsImport';
import {TsResolveFile} from '../models/TsResolveFile';
import {injectable} from 'inversify';
import path = require('path');
import vscode = require('vscode');

type LibExports = { [libName: string]: { declarations: ResolveItem[], exports: TsExport[] } };

function isExportable(declaration: TsDeclaration): declaration is TsExportableDeclaration {
    return declaration instanceof TsExportableDeclaration;
}

function isModule(declaration: TsDeclaration): declaration is TsModuleDeclaration {
    return declaration instanceof TsModuleDeclaration;
}

@injectable()
export class ResolveItemFactory {
    public getResolvableItems(files: TsResolveFile[], openDocument: vscode.Uri, filterImports?: TsImport[]): ResolveItem[] {
        let libExports: LibExports = {},
            relativePath = path.parse(openDocument.fsPath);

        // process all the files 
        let fileFilter = (o: TsResolveFile) => (!!o.declarations.length || !!o.exports.length) && o.fsPath !== openDocument.fsPath;

        for (let file of files.filter(fileFilter)) {
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
                        } else if (ex instanceof TsAllFromExport) {
                            libExports[fromLib].declarations.forEach(o => o.libraryName = key);
                            libExports[key].declarations.push(...libExports[fromLib].declarations);
                            libExports[fromLib].declarations = [];
                        } else if (ex instanceof TsNamedFromExport) {
                            libExports[fromLib].declarations
                                .filter(o => ex.specifiers.some(s => s.specifier === (o.alias || o.declaration.name)))
                                .forEach(o => {
                                    o.libraryName = key;
                                    let spec = ex.specifiers.find(s => s.specifier === (o.alias || o.declaration.name));
                                    if (spec.alias) {
                                        o.alias = spec.alias;
                                    }
                                    libExports[fromLib].declarations.splice(libExports[fromLib].declarations.indexOf(o), 1);
                                    libExports[key].declarations.push(o);
                                });
                        }
                    }
                }
            });

        let items = Object.keys(libExports).reduce((all, key) => all.concat(libExports[key].declarations), []);

        if (filterImports) {
            for (let imp of filterImports) {
                if (imp instanceof TsNamedImport) {
                    items = items.filter(o => o.libraryName !== imp.libraryName || !imp.specifiers.some(s => s.specifier === o.declaration.name));
                } else if (imp instanceof TsNamespaceImport || imp instanceof TsExternalModuleImport) {
                    items = items.filter(o => o.libraryName !== imp.libraryName);
                } else if (imp instanceof TsDefaultImport) {
                    items = items.filter(o => (!(o.declaration instanceof TsDefaultDeclaration) || imp.libraryName !== o.libraryName));
                }
            }
        }

        return items;
    }

    private processLocalFile(libExports: LibExports, file: TsResolveFile, relativeDocument: path.ParsedPath): void {
        let libname = path.relative(relativeDocument.dir, path.format(file.path)).replace('.ts', '');
        if (!libname.startsWith('.')) {
            libname = './' + libname;
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
        if (file.exports.some(o => o instanceof TsDefaultExport)) {
            libExports[libname].declarations.push(new ResolveItem(new TsDefaultDeclaration(libname), libname, file));
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
                if (!libExports[mod.name]) {
                    libExports[mod.name] = { declarations: [], exports: [] };
                }
                if (!libExports[mod.name].declarations.some(o => o.libraryName === mod.name)) {
                    libExports[mod.name].declarations.push(new ResolveItem(mod, mod.name, file, mod.moduleNamespaceName));
                }

                for (let declaration of mod.declarations) {
                    if (isExportable(declaration) && declaration.isExported) {
                        if (!libExports[mod.name].declarations.some(o => o.declaration.name === declaration.name)) {
                            libExports[mod.name].declarations.push(new ResolveItem(declaration, mod.name, file));
                        }
                    }
                }

                for (let ex of mod.exports) {
                    if (ex instanceof TsAssignedExport) {
                        for (let declaration of ex.declarations) {
                            if (isExportable(declaration) && declaration.isExported && !libExports[mod.name].declarations.some(o => o.declaration.name === declaration.name)) {
                                libExports[mod.name].declarations.push(new ResolveItem(declaration, mod.name, file));
                            } else if (declaration instanceof TsModuleDeclaration) {
                                declaration.declarations.forEach(o => {
                                    if (isExportable(o) && o.isExported && !libExports[mod.name].declarations.some(d => d.declaration.name === o.name)) {
                                        libExports[mod.name].declarations.push(new ResolveItem(o, mod.name, file));
                                    }
                                });
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
