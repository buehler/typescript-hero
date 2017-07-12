export abstract class CodeFixImplementAbstract {
    public pubProperty: string;

    public abstract abstractMethod(): void;
    public abstract abstractMethodWithParams(p1: string, p2): number;
}

export interface CodeFixImplementInterface {
    property: number;

    interfaceMethod(): string;
    interfaceMethodWithParams(p1: string, p2): number;
}
