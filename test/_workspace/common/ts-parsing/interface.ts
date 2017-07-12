interface NonExportedInterface {
    property1: string;
    property2: number;
    method1();
    method2(param1: string): void;
}

export interface ExportedInterface {
    property1: string;
    property2: number;
    method1({ param1, param2 });
    method2([param1, param2]): void;
}

interface Generic<T> { }
interface MultiGeneric<TIn, TOut, TError> { }
