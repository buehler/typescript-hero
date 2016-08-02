export class TsResolveSpecifier {
    constructor(public specifier: string, public alias?: string) { }

    public toImport(): string {
        return `${this.specifier}${this.alias ? ` as ${this.alias}` : ''}`;
    }
}
