import { moduleFunc } from 'SomeModule';
import { notUsed } from 'Foobar';

export class Test {
    constructor() {
        init();
    }
}

function init() { moduleFunc(); }
