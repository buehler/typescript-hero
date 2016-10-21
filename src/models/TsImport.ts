import { TsImportOptions } from './TsImportOptions';
import { TsNode } from './TsNode';
import { TsResolveSpecifier } from './TsResolveSpecifier';
import { Position, Range, TextDocument } from 'vscode';

export abstract class TsImport extends TsNode {
    constructor(public libraryName: string, start?: number, end?: number) {
        super(start, end);
    }

    public getRange(document: TextDocument): Range {
        return this.start !== undefined && this.end !== undefined ?
            new Range(
                document.lineAt(document.positionAt(this.start).line).rangeIncludingLineBreak.start,
                document.lineAt(document.positionAt(this.end).line).rangeIncludingLineBreak.end
            ) :
            new Range(new Position(0, 0), new Position(0, 0));
    }

    public abstract toImport(options: TsImportOptions): string;
}

export abstract class TsAliasedImport extends TsImport {
    constructor(libraryName: string, public alias: string, start?: number, end?: number) {
        super(libraryName, start, end);
    }
}

export class TsStringImport extends TsImport {
    public toImport({pathDelimiter}: TsImportOptions): string {
        return `import ${pathDelimiter}${this.libraryName}${pathDelimiter};\n`;
    }
}

export class TsNamedImport extends TsImport {
    public specifiers: TsResolveSpecifier[] = [];

    public toImport(options: TsImportOptions): string {
        let {pathDelimiter, spaceBraces, multiLineWrapThreshold} = options,
            space = spaceBraces ? ' ' : '',
            specifiers = this.specifiers.sort(this.specifierSort).map(o => o.toImport()).join(', '),
            lib = this.libraryName;

        let importString = `import {${space}${specifiers}${space}} from ${pathDelimiter}${lib}${pathDelimiter};\n`;
        if (importString.length > multiLineWrapThreshold) {
            return this.toMultiLineImport(options);
        }
        return importString;
    }

    public clone(): TsNamedImport {
        let clone = new TsNamedImport(this.libraryName, this.start, this.end);
        this.specifiers.forEach(o => clone.specifiers.push(o));
        return clone;
    }

    public toMultiLineImport({pathDelimiter, tabSize}: TsImportOptions): string {
        let spacings = Array(tabSize + 1).join(' ');
        return `import {
${this.specifiers.sort(this.specifierSort).map(o => `${spacings}${o.toImport()}`).join(',\n')}
} from ${pathDelimiter}${this.libraryName}${pathDelimiter};\n`;
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
