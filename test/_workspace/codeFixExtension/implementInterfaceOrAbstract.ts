import { CodeFixImplementAbstract, CodeFixImplementInterface } from './exportedObjects';


class InterfaceImplement implements CodeFixImplementInterface {
}

class AbstractImplement extends CodeFixImplementAbstract {
}

abstract class InternalAbstract {
    public method(): void{}
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
