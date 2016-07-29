import {TsResolveFile} from '../models/TsResolveFile';
import {ResolveItem} from '../models/ResolveItem';
import * as inversify from 'inversify';

@inversify.injectable()
export class ResolveItemFactory {
    public getExportedDeclarations(files: TsResolveFile[]): ResolveItem[] {
        let items: ResolveItem[] = [];

        for (let file of files) {
            console.log(file.libraryName);
        }

        return items;
    }
}
