interface Foo<T, T2> {
    prop: T2;
    something(): T;
    someone(id: T, ret: T2): void;
}

class Bar implements Foo<string, number> {

}

// abstract class Baz<T> {
//     protected abstract blub(): T;
// }

// class Foobar extends Baz<string> {

// }
