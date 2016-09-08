abstract class AbstractClass {
    public method1() { }

    public abstract abstractMethod(): void;
}

class NonExportedClass {
    constructor(public param1: string) { }

    public method1(): void { }
    protected method2(): void { }
    private method3(): void {
        let variable = '';
    }
}

export class ExportedClass {
    private _property: string;
    protected protect: string;
    public pub: string;

    public get property(): string {
        return this._property;
    }

    public set property(value: string) {
        this._property = value;
    }
}
