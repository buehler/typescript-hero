import { TsDefaultImport, TsNamedImport } from './TsImport';
import { TsImportOptions } from './TsImportOptions';
import { TsResolveSpecifier } from './TsResolveSpecifier';

/**
 * Proxy class that wraps a TsNamedImport or a TsDefaultImport. Is used by the DocumentController to
 * determine if a default import or a named import is used.
 * 
 * @export
 * @class ImportProxy
 * @extends {TsNamedImport}
 */
export class ImportProxy extends TsNamedImport {
    public defaultPurposal: string;
    public defaultAlias: string;

    constructor(library: TsNamedImport | TsDefaultImport | string, start?: number, end?: number) {
        super(typeof library !== 'string' ? library.libraryName : library, start, end);

        if (typeof library !== 'string') {
            this.start = library.start;
            this.end = library.end;
            if (library instanceof TsNamedImport) {
                this.specifiers = library.specifiers;
                let defaultSpec = this.specifiers.find(o => o.specifier === 'default');
                if (defaultSpec) {
                    this.specifiers.splice(this.specifiers.indexOf(defaultSpec), 1);
                    this.defaultAlias = defaultSpec.alias;
                }
            } else {
                this.defaultAlias = library.alias;
            }
        }
    }

    /**
     * Adds a specifier to the import.
     * 
     * @param {string} name
     * 
     * @memberOf ImportProxy
     */
    public addSpecifier(name: string): void {
        if (!this.specifiers.some(o => o.specifier === name)) {
            this.specifiers.push(new TsResolveSpecifier(name));
        }
    }

    /**
     * Clone this proxy.
     * 
     * @returns {ImportProxy}
     * 
     * @memberOf ImportProxy
     */
    public clone(): ImportProxy {
        let clone = new ImportProxy(this.libraryName, this.start, this.end);
        clone.specifiers = this.specifiers.map(o => o.clone());
        clone.defaultAlias = this.defaultAlias;
        clone.defaultPurposal = this.defaultPurposal;
        return clone;
    }

    /**
     * Does check for equality to another proxy. All properties are checked and as a last step,
     * the specifiers are (with order in mind) checked.
     * 
     * @param {ImportProxy} imp
     * @returns {boolean}
     * 
     * @memberOf ImportProxy
     */
    public isEqual(imp: ImportProxy): boolean {
        let sameSpecifiers = (specs1: TsResolveSpecifier[], specs2: TsResolveSpecifier[]) => {
            for (let spec of specs1) {
                let spec2 = specs2[specs1.indexOf(spec)];
                if (!spec2 ||
                    spec.specifier !== spec2.specifier ||
                    spec.alias !== spec2.alias) {
                    return false;
                }
            }
            return true;
        };

        return this.libraryName === imp.libraryName &&
            this.defaultAlias === imp.defaultAlias &&
            this.defaultPurposal === imp.defaultPurposal &&
            this.specifiers.length === imp.specifiers.length &&
            sameSpecifiers(this.specifiers, imp.specifiers);
    }

    /**
     * Overwrites the base function, does return an import string based on specifiers used. If only a default
     * specifier is used, a normal default import string is returned, otherwise a TsNamedImport with (or without)
     * the default import is returned.
     * 
     * @param {TsImportOptions} options
     * @returns {string}
     * 
     * @memberOf ImportProxy
     */
    public toImport(options: TsImportOptions): string {
        if (this.specifiers.length <= 0) {
            return new TsDefaultImport(this.libraryName, this.defaultAlias, this.start, this.end).toImport(options);
        }
        if (this.defaultAlias) {
            this.specifiers.push(new TsResolveSpecifier('default', this.defaultAlias));
        }
        return super.toImport(options);
    }
}
