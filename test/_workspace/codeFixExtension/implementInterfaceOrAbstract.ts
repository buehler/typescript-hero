import { CodeFixImplementInterface } from './exportedObjects';


class InterfaceImplement implements CodeFixImplementInterface {

}

class AbstractImplement {

}

abstract class InternalAbstract {
    public method(): void{}
    public abstract abstractMethod(): void;
}

interface InternalInterface {
    method(p1: string): void;
    methodTwo();
}

class InternalInterfaceImplement {

}

class InternalAbstractImplement extends InternalAbstract {

}
