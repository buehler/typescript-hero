import 'string-only';
import { Foobar } from 'my-lib';

class Yay extends Foobar<string> {
    public name: string;

    public method(): void {
    }
}

class ArrList<T> {
    public method(param: T): T {}
}
