import { CodeFixImplementAbstract, CodeFixImplementInterface } from './exportedObjects';


class InterfaceImplement implements CodeFixImplementInterface {
}

class AbstractImplement extends CodeFixImplementAbstract {
}

abstract class InternalAbstract {
    public method(): void { }
    public abstract abstractMethod(): void;
}

interface InternalInterface {
    method(p1: string): void;
    methodTwo();
}

class InternalInterfaceImplement implements InternalInterface {
}

class InternalAbstractImplement extends InternalAbstract {
}

interface GenericInterface<T1, T2> {
    method(p1: T1): T2;
}

abstract class GenericAbstractClass<T1, T2, T3> {
    public abstract abstractMethod(p1: T1): T2;
    protected abstract protMethod(p2: T2, p3?: T3);
}

class ImplementGenericInterface implements GenericInterface<string, number> {
}

class ImplementGenericAbstract extends GenericAbstractClass<string, number, boolean> {
}
