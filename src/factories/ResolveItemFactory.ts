import {TsResolveFile} from '../models/TsResolveFile';
import {ResolveItem} from '../models/ResolveItem';
import * as inversify from 'inversify';
import {TsDeclaration, TsExportableDeclaration} from '../models/TsDeclaration';
import {TsExport} from '../models/TsExport';

function isExportable(declaration: TsDeclaration): declaration is TsExportableDeclaration {
    return declaration instanceof TsExportableDeclaration;
}

@inversify.injectable()
export class ResolveItemFactory {
    public getResolvableItems(files: TsResolveFile[]): ResolveItem[] {
        let libExports: { [libName: string]: { declarations: ResolveItem[], exports: TsExport[] } } = {};

        for (let file of files) {
            if (!file.isDeclarationFile) {
                let libname = file.path.name;
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

            // if (!libExports[file.libraryName]) {
            //     libExports[file.libraryName] = {declarations: [], exports: []};
            // }

            // if (!file.isDeclarationFile) {
            //     libExports[file.libraryName].declarations.push(...file.declarations);
            //     libExports[file.libraryName].exports.push(...file.exports);
            // } else {

            // }
        }

        // calculate all export statements (shovel around declarations.)

        return Object.keys(libExports).reduce((all, key) => all.concat(libExports[key].declarations), []);
    }

    public filterAlreadyImported(items: ResolveItem[], files: TsResolveFile[]): ResolveItem[] {
        return [];
    }
    // private foo() {
    //     if (this.path.ext === '.ts') {
    //         return this.path.name;
    //     }
    //     let dirSplit = this.path.dir.split('/');

    //     let nodeIndex = dirSplit.indexOf('node_modules');
    //     if (nodeIndex > -1 && nodeIndex + 1 <= dirSplit.length) {
    //         return dirSplit.slice(nodeIndex + 1).join('/');
    //     }

    //     return dirSplit[dirSplit.length - 1];
    // }
}
