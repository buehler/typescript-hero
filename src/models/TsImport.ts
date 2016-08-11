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
    public toImport(options: TsImportOptions): string {
        return `import ${options.pathDelimiter}${this.libraryName}${options.pathDelimiter};\n`;
    }
}

export class TsNamedImport extends TsImport {
    public specifiers: TsResolveSpecifier[] = [];

    public toImport(options: TsImportOptions): string {
        return `import {${options.spaceBraces ? ' ' : ''}${this.specifiers.sort(this.specifierSort).map(o => o.toImport()).join(', ')}${options.spaceBraces ? ' ' : ''}} from ${options.pathDelimiter}${this.libraryName}${options.pathDelimiter};\n`;
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
    public toImport(options: TsImportOptions): string {
        return `import * as ${this.alias} from ${options.pathDelimiter}${this.libraryName}${options.pathDelimiter};\n`;
    }
}

export class TsExternalModuleImport extends TsAliasedImport {
    public toImport(options: TsImportOptions): string {
        return `import ${this.alias} = require(${options.pathDelimiter}${this.libraryName}${options.pathDelimiter});\n`;
    }
}

export class TsDefaultImport extends TsAliasedImport {
    public toImport(options: TsImportOptions): string {
        return `import ${this.alias} from ${options.pathDelimiter}${this.libraryName}${options.pathDelimiter};\n`;
    }
}
