import { TsImportOptions } from './TsImportOptions';
import { TsNode } from './TsNode';
import { TsResolveSpecifier } from './TsResolveSpecifier';
import { Position, Range, TextDocument } from 'vscode';

/**
 * Basic import class. Defines an import in a document.
 * If no start and end points are given, the import is considered "new".
 * 
 * @export
 * @abstract
 * @class TsImport
 * @extends {TsNode}
 */
export abstract class TsImport extends TsNode {
    constructor(public libraryName: string, start?: number, end?: number) {
        super(start, end);
    }

    /**
     * Function that calculates the document range of the import (from / to location in the given document).
     * 
     * @param {TextDocument} document
     * @returns {Range} - The actual range of the imports text in the given document.
     * 
     * @memberOf TsImport
     */
    public getRange(document: TextDocument): Range {
        return this.start !== undefined && this.end !== undefined ?
            new Range(
                document.lineAt(document.positionAt(this.start).line).rangeIncludingLineBreak.start,
                document.lineAt(document.positionAt(this.end).line).rangeIncludingLineBreak.end
            ) :
            new Range(new Position(0, 0), new Position(0, 0));
    }

    /**
     * Method that "stringifies" the import. Writes all specifiers and special things into one string.
     * The returned string can be multi-line.
     * 
     * @abstract
     * @param {TsImportOptions} options - The options object that is delivered by the extensionconfig.
     * @returns {string} - The stringified import.
     * 
     * @memberOf TsImport
     */
    public abstract toImport(options: TsImportOptions): string;
}

/**
 * Base class for an aliased import.
 * 
 * @export
 * @abstract
 * @class TsAliasedImport
 * @extends {TsImport}
 */
export abstract class TsAliasedImport extends TsImport {
    constructor(libraryName: string, public alias: string, start?: number, end?: number) {
        super(libraryName, start, end);
    }
}

/**
 * Simple string import (i.e. import "reflect-metadata";).
 * 
 * @export
 * @class TsStringImport
 * @extends {TsImport}
 */
export class TsStringImport extends TsImport {
    public toImport({pathDelimiter}: TsImportOptions): string {
        return `import ${pathDelimiter}${this.libraryName}${pathDelimiter};\n`;
    }
}

/**
 * Basic typescript import (ES6 style). Does contain multiple symbols of a file and converts
 * itself to a multiline import if the threshold is reached.
 * (i.e. import {Foobar} from ...).
 * 
 * @export
 * @class TsNamedImport
 * @extends {TsImport}
 */
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

    /**
     * Clones the named import. Returnes a new instance.
     * 
     * @returns {TsNamedImport}
     * 
     * @memberOf TsNamedImport
     */
    public clone(): TsNamedImport {
        let clone = new TsNamedImport(this.libraryName, this.start, this.end);
        this.specifiers.forEach(o => clone.specifiers.push(o));
        return clone;
    }

    /**
     * Converts the named import into a multiline import.
     * 
     * @param {TsImportOptions} {pathDelimiter, tabSize}
     * @returns {string}
     * 
     * @memberOf TsNamedImport
     */
    public toMultiLineImport({pathDelimiter, tabSize}: TsImportOptions): string {
        let spacings = Array(tabSize + 1).join(' ');
        return `import {
${this.specifiers.sort(this.specifierSort).map(o => `${spacings}${o.toImport()}`).join(',\n')}
} from ${pathDelimiter}${this.libraryName}${pathDelimiter};\n`;
    }

    /**
     * Sorts the specifiers by name. Sorting function that is passed to [].sort().
     * 
     * @private
     * @param {TsResolveSpecifier} i1
     * @param {TsResolveSpecifier} i2
     * @returns {number} - Sort index
     * 
     * @memberOf TsNamedImport
     */
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

/**
 * Import that imports a whole namespace (i.e. import * as foobar from 'foobar';).
 * 
 * @export
 * @class TsNamespaceImport
 * @extends {TsAliasedImport}
 */
export class TsNamespaceImport extends TsAliasedImport {
    public toImport({pathDelimiter}: TsImportOptions): string {
        return `import * as ${this.alias} from ${pathDelimiter}${this.libraryName}${pathDelimiter};\n`;
    }
}

/**
 * Alternative to the namespace import. Can be used by various libraries.
 * (i.e. import foobar = require('foobar')).
 * 
 * @export
 * @class TsExternalModuleImport
 * @extends {TsAliasedImport}
 */
export class TsExternalModuleImport extends TsAliasedImport {
    public toImport({pathDelimiter}: TsImportOptions): string {
        return `import ${this.alias} = require(${pathDelimiter}${this.libraryName}${pathDelimiter});\n`;
    }
}

/**
 * Default import. Imports the default exports of a file.
 * (i.e. import foobar from ...).
 * 
 * @export
 * @class TsDefaultImport
 * @extends {TsAliasedImport}
 */
export class TsDefaultImport extends TsAliasedImport {
    public toImport({pathDelimiter}: TsImportOptions): string {
        return `import ${this.alias} from ${pathDelimiter}${this.libraryName}${pathDelimiter};\n`;
    }
}
