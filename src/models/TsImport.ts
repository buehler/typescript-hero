import {TsImportOptions} from './TsImportOptions';
import {TsResolveSpecifier} from './TsResolveSpecifier';

export abstract class TsImport {
    constructor(public libraryName: string) { }

    public abstract toImport(options: TsImportOptions): string;
}

export abstract class TsAliasedImport extends TsImport {
    constructor(libraryName: string, public alias: string) {
        super(libraryName);
    }
}

export class TsStringImport extends TsImport {
    public toImport({pathDelimiter}: TsImportOptions): string {
        return `import ${pathDelimiter}${this.libraryName}${pathDelimiter};\n`;
    }
}

export class TsNamedImport extends TsImport {
    public specifiers: TsResolveSpecifier[] = [];

    public toImport({pathDelimiter, spaceBraces}: TsImportOptions): string {
        return `import {${spaceBraces ? ' ' : ''}${this.specifiers.sort(this.specifierSort).map(o => o.toImport()).join(', ')}${spaceBraces ? ' ' : ''}} from ${pathDelimiter}${this.libraryName}${pathDelimiter};\n`;
    }

    private specifierSort(i1: TsResolveSpecifier, i2: TsResolveSpecifier): number {
        let strA = i1.specifier.toLowerCase(),
            strB = i2.specifier.toLowerCase();

        if (strA < strB) {
            return -1;
        } else if (strA > strB) {
            return 1;
        }
        return 0;
    }
}

export class TsNamespaceImport extends TsAliasedImport {
    public toImport({pathDelimiter}: TsImportOptions): string {
        return `import * as ${this.alias} from ${pathDelimiter}${this.libraryName}${pathDelimiter};\n`;
    }
}

export class TsExternalModuleImport extends TsAliasedImport {
    public toImport({pathDelimiter}: TsImportOptions): string {
        return `import ${this.alias} = require(${pathDelimiter}${this.libraryName}${pathDelimiter});\n`;
    }
}

export class TsDefaultImport extends TsAliasedImport {
    public toImport({pathDelimiter}: TsImportOptions): string {
        return `import ${this.alias} from ${pathDelimiter}${this.libraryName}${pathDelimiter};\n`;
    }
}
