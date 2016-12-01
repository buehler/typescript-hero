
class ManagedClass {

}

class ManagedClassWithCtor {
    constructor(public foobar: string, barbaz: number) { }
}

class ManagedClassWithMethods {
    public method(): void { }

    protected whatever(): string {
        return '';
    }

    private ohyea(foo: string, bar: number): ManagedClass {
        return {} as any;
    }
}

class ManagedClassWithProperties {
    public foo: string;
    protected bar: string;
    private baz: string;
}

class ManagedClassFull {
    public foo: string;
    protected bar: string;
    private baz: string;

    constructor(public foobar: string, barbaz: number) { }

    public method(): void { }

    protected whatever(): string {
        return '';
    }

    private ohyea(foo: string, bar: number): ManagedClass {
        return {} as any;
    }
}

class EmptyClass {
}
