import {TsResolveSpecifier} from './TsResolveSpecifier';

export abstract class TsImport {
    constructor(public libraryName: string) { }

    public abstract toImport(delimiter: string): string;
}

export abstract class TsAliasedImport extends TsImport {
    constructor(libraryName: string, public alias: string) {
        super(libraryName);
    }
}

export class TsStringImport extends TsImport {
    public toImport(delimiter: string): string {
        return `import ${delimiter}${this.libraryName}${delimiter};\n`;
    }
}

export class TsNamedImport extends TsImport {
    public specifiers: TsResolveSpecifier[] = [];

    public toImport(delimiter: string): string {
        return `import {${this.specifiers.sort(this.specifierSort).map(o => o.toImport()).join(', ')}} from ${delimiter}${this.libraryName}${delimiter};\n`;
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
    public toImport(delimiter: string): string {
        return `import * as ${this.alias} from ${delimiter}${this.libraryName}${delimiter};\n`;
    }
}

export class TsExternalModuleImport extends TsAliasedImport {
    public toImport(delimiter: string): string {
        return `import ${this.alias} = require(${delimiter}${this.libraryName}${delimiter});\n`;
    }
}

export class TsDefaultImport extends TsAliasedImport {
    public toImport(delimiter: string): string {
        return `import ${this.alias} from ${delimiter}${this.libraryName}${delimiter};\n`;
    }
}
