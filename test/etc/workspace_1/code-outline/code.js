import 'string-only';

import { Foobar } from 'my-lib';

class Yay extends Foobar {
  constructor() {
    this.name = 'foobar';
  }

  method() {
    console.log(this.name);
  }
}
